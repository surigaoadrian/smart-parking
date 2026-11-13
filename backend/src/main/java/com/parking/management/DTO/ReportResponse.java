package com.parking.management.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Everything the admin Reports page shows for one date range (both dates inclusive). */
public record ReportResponse(
        LocalDate from,
        LocalDate to,
        Totals totals,
        List<Breakdown> byMethod,
        List<Breakdown> byVehicleType,
        List<DayTotal> byDay,
        List<StaffTotal> byStaff,
        List<PaymentRow> payments,
        List<VoidRow> voids) {

    public record Totals(
            BigDecimal revenue,
            long payments,
            BigDecimal averageFee,
            Long averageStayMinutes,
            long ticketsIssued,
            long voids,
            BigDecimal waived) {
    }

    /** One group of payments, e.g. all CASH payments. */
    public record Breakdown(String key, long count, BigDecimal amount) {
    }

    public record DayTotal(LocalDate date, long count, BigDecimal amount) {
    }

    /** One staff member's work in the period, for checking the cash drawer at end of shift. */
    public record StaffTotal(
            Long staffId,
            String fullName,
            String username,
            long ticketsIssued,
            long payments,
            BigDecimal amount,
            BigDecimal cash,
            long voids) {
    }

    public record PaymentRow(
            String receiptNumber,
            String ticketNumber,
            String plateNumber,
            String vehicleType,
            String slotNumber,
            LocalDateTime entryTime,
            LocalDateTime paymentTime,
            Long stayMinutes,
            BigDecimal amount,
            String paymentMethod,
            String processedBy) {
    }

    public record VoidRow(
            String ticketNumber,
            String plateNumber,
            String slotNumber,
            LocalDateTime entryTime,
            LocalDateTime voidedAt,
            Long stayMinutes,
            BigDecimal waivedFee,
            String reason,
            String issuedBy,
            String voidedBy) {
    }
}
