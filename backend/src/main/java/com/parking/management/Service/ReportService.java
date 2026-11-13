package com.parking.management.Service;

import com.parking.management.DTO.ReportResponse;
import com.parking.management.DTO.ReportResponse.Breakdown;
import com.parking.management.DTO.ReportResponse.DayTotal;
import com.parking.management.DTO.ReportResponse.PaymentRow;
import com.parking.management.DTO.ReportResponse.StaffTotal;
import com.parking.management.DTO.ReportResponse.Totals;
import com.parking.management.DTO.ReportResponse.VoidRow;
import com.parking.management.Entity.ParkingLot;
import com.parking.management.Entity.Payment;
import com.parking.management.Entity.Staff;
import com.parking.management.Entity.Ticket;
import com.parking.management.Enums.PaymentMethod;
import com.parking.management.Enums.PaymentStatus;
import com.parking.management.Enums.TicketStatus;
import com.parking.management.Exceptions.BadRequestException;
import com.parking.management.Exceptions.ParkingException;
import com.parking.management.Repository.PaymentRepository;
import com.parking.management.Repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/** Builds the admin revenue / activity report for a date range. */
@Service
public class ReportService {
    // Keeps a single report fast; a year is plenty for a single lot.
    private static final int MAX_DAYS = 366;

    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;
    private final PaymentService paymentService;

    public ReportService(
            PaymentRepository paymentRepository,
            TicketRepository ticketRepository,
            PaymentService paymentService) {

        this.paymentRepository = paymentRepository;
        this.ticketRepository = ticketRepository;
        this.paymentService = paymentService;
    }

    @Transactional(readOnly = true)
    public ReportResponse buildReport(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new BadRequestException("Choose a start and end date");
        }
        if (to.isBefore(from)) {
            throw new BadRequestException("The end date must be on or after the start date");
        }
        if (ChronoUnit.DAYS.between(from, to) + 1 > MAX_DAYS) {
            throw new BadRequestException("Reports can cover at most " + MAX_DAYS + " days");
        }

        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        List<Payment> payments = paymentRepository
                .findByPaymentTimeGreaterThanEqualAndPaymentTimeLessThanOrderByPaymentTimeDesc(start, end)
                .stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .toList();
        List<Ticket> issued = ticketRepository
                .findByEntryTimeGreaterThanEqualAndEntryTimeLessThan(start, end);
        List<Ticket> voided = ticketRepository
                .findByStatusAndExitTimeGreaterThanEqualAndExitTimeLessThanOrderByExitTimeDesc(
                        TicketStatus.VOIDED, start, end);

        List<VoidRow> voidRows = voided.stream().map(this::toVoidRow).toList();

        return new ReportResponse(
                from,
                to,
                totals(payments, issued.size(), voidRows),
                groupPayments(payments, p -> p.getPaymentMethod().name()),
                groupPayments(payments, p -> p.getTicket().getVehicle().getVehicleType().name()),
                byDay(payments, from, to),
                byStaff(payments, issued, voided),
                payments.stream().map(this::toPaymentRow).toList(),
                voidRows);
    }

    private Totals totals(List<Payment> payments, long ticketsIssued, List<VoidRow> voids) {
        BigDecimal revenue = sum(payments);
        BigDecimal averageFee = payments.isEmpty()
                ? null
                : revenue.divide(BigDecimal.valueOf(payments.size()), 2, RoundingMode.HALF_UP);
        Long averageStay = payments.isEmpty()
                ? null
                : Math.round(payments.stream()
                        .mapToLong(p -> stayMinutes(p.getTicket().getEntryTime(), p.getPaymentTime()))
                        .average()
                        .orElse(0));
        BigDecimal waived = voids.stream()
                .map(VoidRow::waivedFee)
                .filter(fee -> fee != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new Totals(revenue, payments.size(), averageFee, averageStay, ticketsIssued, voids.size(), waived);
    }

    private List<Breakdown> groupPayments(List<Payment> payments, Function<Payment, String> key) {
        Map<String, List<Payment>> groups = new LinkedHashMap<>();
        for (Payment payment : payments) {
            groups.computeIfAbsent(key.apply(payment), k -> new ArrayList<>()).add(payment);
        }
        return groups.entrySet().stream()
                .map(e -> new Breakdown(e.getKey(), e.getValue().size(), sum(e.getValue())))
                .sorted(Comparator.comparing(Breakdown::amount).reversed())
                .toList();
    }

    /** One entry per day in the range, including days without payments. */
    private List<DayTotal> byDay(List<Payment> payments, LocalDate from, LocalDate to) {
        Map<LocalDate, List<Payment>> perDay = new LinkedHashMap<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            perDay.put(day, new ArrayList<>());
        }
        for (Payment payment : payments) {
            perDay.get(payment.getPaymentTime().toLocalDate()).add(payment);
        }
        return perDay.entrySet().stream()
                .map(e -> new DayTotal(e.getKey(), e.getValue().size(), sum(e.getValue())))
                .toList();
    }

    private List<StaffTotal> byStaff(List<Payment> payments, List<Ticket> issued, List<Ticket> voided) {
        Map<Long, StaffCounter> counters = new LinkedHashMap<>();
        Function<Staff, StaffCounter> counter = staff ->
                counters.computeIfAbsent(staff == null ? null : staff.getId(), id -> new StaffCounter(staff));

        for (Payment payment : payments) {
            StaffCounter c = counter.apply(payment.getProcessedBy());
            c.payments++;
            c.amount = c.amount.add(payment.getAmount());
            if (payment.getPaymentMethod() == PaymentMethod.CASH) {
                c.cash = c.cash.add(payment.getAmount());
            }
        }
        for (Ticket ticket : issued) {
            counter.apply(ticket.getIssuedBy()).ticketsIssued++;
        }
        for (Ticket ticket : voided) {
            counter.apply(ticket.getVoidedBy()).voids++;
        }

        return counters.values().stream()
                .map(StaffCounter::toTotal)
                .sorted(Comparator.comparing(StaffTotal::amount).reversed()
                        .thenComparing(StaffTotal::fullName))
                .toList();
    }

    private PaymentRow toPaymentRow(Payment payment) {
        Ticket ticket = payment.getTicket();
        return new PaymentRow(
                payment.getReceiptNumber(),
                ticket.getTicketNumber(),
                ticket.getVehicle().getPlateNumber(),
                ticket.getVehicle().getVehicleType().name(),
                ticket.getParkingSlot().getSlotNumber(),
                ticket.getEntryTime(),
                payment.getPaymentTime(),
                stayMinutes(ticket.getEntryTime(), payment.getPaymentTime()),
                payment.getAmount(),
                payment.getPaymentMethod().name(),
                name(payment.getProcessedBy()));
    }

    private VoidRow toVoidRow(Ticket ticket) {
        return new VoidRow(
                ticket.getTicketNumber(),
                ticket.getVehicle().getPlateNumber(),
                ticket.getParkingSlot().getSlotNumber(),
                ticket.getEntryTime(),
                ticket.getExitTime(),
                stayMinutes(ticket.getEntryTime(), ticket.getExitTime()),
                waivedFee(ticket),
                ticket.getVoidReason(),
                name(ticket.getIssuedBy()),
                name(ticket.getVoidedBy()));
    }

    /** What the ticket would have cost at the moment it was voided, using today's rates. */
    private BigDecimal waivedFee(Ticket ticket) {
        ParkingLot lot = ticket.getParkingSlot().getParkingLot();
        if (lot == null || ticket.getExitTime() == null) {
            return null;
        }
        try {
            return paymentService.calculateFee(ticket, ticket.getExitTime(), lot);
        } catch (ParkingException e) {
            return null; // rates not configured
        }
    }

    private static long stayMinutes(LocalDateTime entry, LocalDateTime exit) {
        if (entry == null || exit == null) {
            return 0;
        }
        return Math.max(0, Duration.between(entry, exit).toMinutes());
    }

    private static BigDecimal sum(List<Payment> payments) {
        return payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String name(Staff staff) {
        return staff == null ? null : staff.getFullName();
    }

    private static final class StaffCounter {
        private final Staff staff;
        private long ticketsIssued;
        private long payments;
        private long voids;
        private BigDecimal amount = BigDecimal.ZERO;
        private BigDecimal cash = BigDecimal.ZERO;

        private StaffCounter(Staff staff) {
            this.staff = staff;
        }

        private StaffTotal toTotal() {
            return new StaffTotal(
                    staff == null ? null : staff.getId(),
                    // Records made before staff login existed have no staff member.
                    staff == null ? "Before staff login" : staff.getFullName(),
                    staff == null ? null : staff.getUsername(),
                    ticketsIssued,
                    payments,
                    amount,
                    cash,
                    voids);
        }
    }
}
