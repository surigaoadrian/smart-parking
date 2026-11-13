package com.parking.management.Repository;

import com.parking.management.Entity.Payment;
import com.parking.management.Entity.Staff;
import com.parking.management.Entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReceiptNumber(String receiptNumber);

    Optional<Payment> findByTicket(Ticket ticket);

    long countByProcessedBy(Staff processedBy);

    // start inclusive, end exclusive
    List<Payment> findByPaymentTimeGreaterThanEqualAndPaymentTimeLessThanOrderByPaymentTimeDesc(
            LocalDateTime start, LocalDateTime end);
}
