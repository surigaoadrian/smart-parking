package com.parking.management.Service;

import com.parking.management.Exceptions.ConflictException;
import com.parking.management.Exceptions.ForbiddenException;
import com.parking.management.Exceptions.NotFoundException;
import com.parking.management.Entity.ParkingLot;
import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Entity.Staff;
import com.parking.management.Entity.Ticket;
import com.parking.management.Entity.Vehicle;
import com.parking.management.Enums.TicketStatus;
import com.parking.management.Repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
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
            ParkingSlot parkingSlot,
            Staff issuedBy) {

        Ticket ticket = new Ticket();

        ticket.setTicketNumber(generateTicketNumber());
        ticket.setVehicle(vehicle);
        ticket.setParkingSlot(parkingSlot);
        ticket.setEntryTime(LocalDateTime.now());
        ticket.setStatus(TicketStatus.ACTIVE);
        ticket.setIssuedBy(issuedBy);

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
     *
     * Attendants may only void a ticket shortly after issuing it (a mistake at the gate).
     * Older tickets have built up a fee, so only an admin may void them.
     */
    @Transactional
    public Ticket voidTicket(String ticketNumber, String reason, Staff voidedBy) {
        Ticket ticket = getTicket(ticketNumber);

        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new ConflictException(
                    "Only active tickets can be voided (ticket is "
                            + ticket.getStatus() + ")"
            );
        }

        if (!voidedBy.isAdmin()) {
            ParkingLot lot = ticket.getParkingSlot().getParkingLot();
            int windowMinutes = lot != null
                    ? lot.getVoidWindowMinutes()
                    : ParkingLot.DEFAULT_VOID_WINDOW_MINUTES;
            long minutesSinceEntry = Duration.between(
                    ticket.getEntryTime(), LocalDateTime.now()).toMinutes();

            if (minutesSinceEntry > windowMinutes) {
                throw new ForbiddenException(
                        "Attendants can only void a ticket within " + windowMinutes
                                + " minutes of issuing it. Ask an admin to void this ticket");
            }
        }

        ticket.setStatus(TicketStatus.VOIDED);
        ticket.setVoidReason(reason.trim());
        ticket.setVoidedBy(voidedBy);
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
