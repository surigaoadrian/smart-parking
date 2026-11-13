package com.parking.management.Repository;

import com.parking.management.Entity.Staff;
import com.parking.management.Entity.Ticket;
import com.parking.management.Enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByTicketNumber(String ticketNumber);

    List<Ticket> findByStatus(TicketStatus status);

    boolean existsByVehicle_PlateNumberAndStatus(String plateNumber, TicketStatus status);

    long countByIssuedByOrVoidedBy(Staff issuedBy, Staff voidedBy);

    // Tickets issued in a period (start inclusive, end exclusive).
    List<Ticket> findByEntryTimeGreaterThanEqualAndEntryTimeLessThan(LocalDateTime start, LocalDateTime end);

    // Voided tickets store the void time in exitTime.
    List<Ticket> findByStatusAndExitTimeGreaterThanEqualAndExitTimeLessThanOrderByExitTimeDesc(
            TicketStatus status, LocalDateTime start, LocalDateTime end);
}
