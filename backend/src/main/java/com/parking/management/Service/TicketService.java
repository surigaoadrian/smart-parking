package com.parking.management.Service;

import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Entity.Ticket;
import com.parking.management.Entity.Vehicle;
import com.parking.management.Enums.TicketStatus;
import com.parking.management.Repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;

    public TicketService(
            TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public Ticket createTicket(
            Vehicle vehicle,
            ParkingSlot parkingSlot) {

        Ticket ticket = new Ticket();

        ticket.setTicketNumber(generateTicketNumber());
        ticket.setVehicle(vehicle);
        ticket.setParkingSlot(parkingSlot);
        ticket.setEntryTime(LocalDateTime.now());
        ticket.setStatus(TicketStatus.ACTIVE);

        return ticketRepository.save(ticket);
    }

    public Ticket getTicket(String ticketNumber) {
        return ticketRepository
                .findByTicketNumber(ticketNumber)
                .orElseThrow(() ->
                        new RuntimeException("Ticket not found")
                );
    }

    public List<Ticket> getActiveTickets() {
        return ticketRepository
                .findByStatus(TicketStatus.ACTIVE);
    }

    private String generateTicketNumber() {
        return "TKT-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();
    }
}
