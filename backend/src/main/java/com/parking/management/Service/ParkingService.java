package com.parking.management.Service;

import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Entity.Ticket;
import com.parking.management.Entity.Vehicle;
import com.parking.management.Enums.SlotType;
import com.parking.management.Enums.VehicleType;
import org.springframework.stereotype.Service;

@Service
public class ParkingService {
    private final VehicleService vehicleService;
    private final ParkingSlotService parkingSlotService;
    private final TicketService ticketService;

    public ParkingService(
            VehicleService vehicleService,
            ParkingSlotService parkingSlotService,
            TicketService ticketService) {

        this.vehicleService = vehicleService;
        this.parkingSlotService = parkingSlotService;
        this.ticketService = ticketService;
    }

    public Ticket enterVehicle(
            String plateNumber,
            VehicleType vehicleType,
            SlotType slotType,
            String slotNumber) {

        Vehicle vehicle =
                vehicleService.getOrCreateVehicle(
                        plateNumber,
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
                slot
        );
    }


}
