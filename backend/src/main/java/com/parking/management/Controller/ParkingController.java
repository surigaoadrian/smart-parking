package com.parking.management.Controller;

import com.parking.management.DTO.EntryRequest;
import com.parking.management.Entity.Ticket;
import com.parking.management.Service.ParkingService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/parking")
public class ParkingController {
    private final ParkingService parkingService;

    public ParkingController(ParkingService parkingService) {
        this.parkingService = parkingService;
    }

    @PostMapping("/entry")
    public Ticket enterVehicle(
            @RequestBody EntryRequest request) {

        return parkingService.enterVehicle(
                request.getPlateNumber(),
                request.getVehicleType(),
                request.getSlotType(),
                request.getSlotNumber()
        );
    }
}
