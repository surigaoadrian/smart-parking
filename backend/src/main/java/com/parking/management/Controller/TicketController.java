package com.parking.management.Controller;

import com.parking.management.DTO.VoidRequest;
import com.parking.management.Entity.Ticket;
import com.parking.management.Service.TicketService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {
    private final TicketService ticketService;

    public TicketController(
            TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/active")
    public List<Ticket> getActiveTickets() {
        return ticketService.getActiveTickets();
    }

    @GetMapping("/{ticketNumber}")
    public Ticket getTicket(
            @PathVariable String ticketNumber) {

        return ticketService.getTicket(ticketNumber);
    }

    @PostMapping("/{ticketNumber}/void")
    public Ticket voidTicket(
            @PathVariable String ticketNumber,
            @Valid @RequestBody VoidRequest request) {

        return ticketService.voidTicket(
                ticketNumber,
                request.getReason()
        );
    }
}
