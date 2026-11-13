package com.parking.management.Service;

import com.parking.management.Exceptions.ConflictException;
import com.parking.management.Exceptions.NotFoundException;
import com.parking.management.Entity.ParkingLot;
import com.parking.management.Entity.Payment;
import com.parking.management.Entity.Staff;
import com.parking.management.Entity.Ticket;
import com.parking.management.Enums.PaymentMethod;
import com.parking.management.Enums.PaymentStatus;
import com.parking.management.Enums.TicketStatus;
import com.parking.management.Repository.PaymentRepository;
import com.parking.management.Repository.TicketRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;
    private final ParkingSlotService parkingSlotService;

    public PaymentService(
            PaymentRepository paymentRepository,
            TicketRepository ticketRepository,
            ParkingSlotService parkingSlotService) {

        this.paymentRepository = paymentRepository;
        this.ticketRepository = ticketRepository;
        this.parkingSlotService = parkingSlotService;
    }

    /** Admins see every payment; attendants only see today's (their shift). */
    public List<Payment> getPayments(Staff viewer) {
        List<Payment> payments = paymentRepository.findAll(
                Sort.by(Sort.Direction.DESC, "paymentTime")
        );

        if (viewer.isAdmin()) {
            return payments;
        }

        LocalDate today = LocalDate.now();
        return payments.stream()
                .filter(p -> p.getPaymentTime() != null
                        && p.getPaymentTime().toLocalDate().equals(today))
                .toList();
    }

    @Transactional
    public Payment processPayment(
            String ticketNumber,
            PaymentMethod paymentMethod,
            Staff processedBy) {

        // 1. Find ticket
        Ticket ticket = ticketRepository
                .findByTicketNumber(ticketNumber)
                .orElseThrow(() ->
                        new NotFoundException("Ticket " + ticketNumber + " not found")
                );

        // 2. Prevent paying completed tickets
        if (ticket.getStatus() == TicketStatus.COMPLETED) {
            throw new ConflictException(
                    "Ticket " + ticketNumber + " is already paid"
            );
        }

        // 3. Prevent paying voided tickets
        if (ticket.getStatus() == TicketStatus.VOIDED) {
            throw new ConflictException(
                    "Ticket " + ticketNumber + " was voided and cannot be paid"
            );
        }

        // 4. Prevent duplicate payments
        if (paymentRepository
                .findByTicket(ticket)
                .isPresent()) {

            throw new ConflictException(
                    "Payment already exists for ticket " + ticketNumber
            );
        }

        // 5. Get the parking lot
        ParkingLot parkingLot = ticket
                .getParkingSlot()
                .getParkingLot();

        if (parkingLot == null) {
            throw new ConflictException(
                    "This slot is not linked to a parking lot. Check the lot configuration"
            );
        }

        // 6. Use one timestamp for fee calculation,
        // payment time, and exit time
        LocalDateTime paymentTime = LocalDateTime.now();

        // 7. Calculate fee using the configured rates
        BigDecimal amount = calculateFee(
                ticket,
                paymentTime,
                parkingLot
        );

        // 8. Create payment
        Payment payment = new Payment();

        payment.setReceiptNumber(
                generateReceiptNumber()
        );

        payment.setTicket(ticket);
        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentTime(paymentTime);
        payment.setProcessedBy(processedBy);

        Payment savedPayment =
                paymentRepository.save(payment);

        // 9. Complete the ticket
        ticket.setExitTime(paymentTime);
        ticket.setStatus(TicketStatus.COMPLETED);

        ticketRepository.save(ticket);

        // 10. Release the parking slot
        parkingSlotService.releaseSlot(
                ticket.getParkingSlot()
        );

        return savedPayment;
    }

    /** The fee for a stay from entry until endTime (also used by reports for voided tickets). */
    public BigDecimal calculateFee(
            Ticket ticket,
            LocalDateTime endTime,
            ParkingLot parkingLot) {

        BigDecimal firstHourRate =
                parkingLot.getFirstHourRate();

        BigDecimal succeedingHourRate =
                parkingLot.getSucceedingHourRate();

        if (firstHourRate == null ||
                succeedingHourRate == null) {

            throw new ConflictException(
                    "Parking rates are not configured. Set them in Settings"
            );
        }

        long minutes = Duration.between(
                ticket.getEntryTime(),
                endTime
        ).toMinutes();

        // Any partial hour counts as a full hour.
        long hours =
                (long) Math.ceil(minutes / 60.0);

        // Minimum charge is always the first hour.
        if (hours <= 1) {
            return firstHourRate;
        }

        long succeedingHours = hours - 1;

        BigDecimal succeedingCharge =
                succeedingHourRate.multiply(
                        BigDecimal.valueOf(
                                succeedingHours
                        )
                );

        return firstHourRate.add(
                succeedingCharge
        );
    }

    private String generateReceiptNumber() {

        return "RCT-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();
    }
}
