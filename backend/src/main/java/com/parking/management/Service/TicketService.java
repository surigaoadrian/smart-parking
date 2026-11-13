package com.parking.management.Service;

import com.parking.management.Exceptions.ConflictException;
import com.parking.management.Exceptions.NotFoundException;
import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Entity.Ticket;
import com.parking.management.Entity.Vehicle;
import com.parking.management.Enums.TicketStatus;
import com.parking.management.Repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    private final ParkingSlotService parkingSlotService;

    public TicketService(
            TicketRepository ticketRepository,
            ParkingSlotService parkingSlotService) {
        this.ticketRepository = ticketRepository;
        this.parkingSlotService = parkingSlotService;
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
                        new NotFoundException(
                                "Ticket " + ticketNumber + " not found"
                        )
                );
    }

    /**
     * Cancels a ticket that was issued by mistake: no payment is taken,
     * the ticket is marked VOIDED with a reason, and its slot is released.
     */
    @Transactional
    public Ticket voidTicket(String ticketNumber, String reason) {
        Ticket ticket = getTicket(ticketNumber);

        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new ConflictException(
                    "Only active tickets can be voided (ticket is "
                            + ticket.getStatus() + ")"
            );
        }

        ticket.setStatus(TicketStatus.VOIDED);
        ticket.setVoidReason(reason.trim());
        ticket.setExitTime(LocalDateTime.now());

        parkingSlotService.releaseSlot(ticket.getParkingSlot());

        return ticketRepository.save(ticket);
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
