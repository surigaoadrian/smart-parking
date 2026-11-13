package com.parking.management.Service;

import com.parking.management.Exceptions.ConflictException;
import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Entity.Staff;
import com.parking.management.Entity.Ticket;
import com.parking.management.Entity.Vehicle;
import com.parking.management.Enums.SlotType;
import com.parking.management.Enums.TicketStatus;
import com.parking.management.Enums.VehicleType;
import com.parking.management.Repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParkingService {
    private final VehicleService vehicleService;
    private final ParkingSlotService parkingSlotService;
    private final TicketService ticketService;
    private final TicketRepository ticketRepository;

    public ParkingService(
            VehicleService vehicleService,
            ParkingSlotService parkingSlotService,
            TicketService ticketService,
            TicketRepository ticketRepository) {

        this.vehicleService = vehicleService;
        this.parkingSlotService = parkingSlotService;
        this.ticketService = ticketService;
        this.ticketRepository = ticketRepository;
    }

    // All steps succeed together or none are saved, so a failure
    // can never leave a slot marked occupied without a ticket.
    @Transactional
    public Ticket enterVehicle(
            String plateNumber,
            VehicleType vehicleType,
            SlotType slotType,
            String slotNumber,
            Staff issuedBy) {

        String plate = normalizePlate(plateNumber);

        // A vehicle can only hold one active ticket at a time.
        if (ticketRepository.existsByVehicle_PlateNumberAndStatus(
                plate,
                TicketStatus.ACTIVE)) {

            throw new ConflictException(
                    "Vehicle " + plate + " is already parked"
            );
        }

        Vehicle vehicle =
                vehicleService.getOrCreateVehicle(
                        plate,
                        vehicleType
                );

        // Use the slot the attendant picked, otherwise auto-pick one.
        ParkingSlot slot =
                (slotNumber != null && !slotNumber.isBlank())
                        ? parkingSlotService.getAvailableSlot(
                                slotNumber,
                                slotType
                        )
                        : parkingSlotService.findAvailableSlot(
                                slotType
                        );

        parkingSlotService.occupySlot(slot);

        return ticketService.createTicket(
                vehicle,
                slot,
                issuedBy
        );
    }

    // "  abc   1234 " -> "ABC 1234", so the same car is always matched.
    private String normalizePlate(String plateNumber) {
        return plateNumber
                .trim()
                .replaceAll("\\s+", " ")
                .toUpperCase();
    }
}
