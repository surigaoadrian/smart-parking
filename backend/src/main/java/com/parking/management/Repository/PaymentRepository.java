package com.parking.management.Repository;

import com.parking.management.Entity.Payment;
import com.parking.management.Entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReceiptNumber(String receiptNumber);

    Optional<Payment> findByTicket(Ticket ticket);
}
