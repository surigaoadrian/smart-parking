package com.parking.management.Repository;

import com.parking.management.Entity.Ticket;
import com.parking.management.Enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByTicketNumber(String ticketNumber);

    List<Ticket> findByStatus(TicketStatus status);
}
