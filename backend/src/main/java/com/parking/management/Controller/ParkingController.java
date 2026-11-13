package com.parking.management.Controller;

import com.parking.management.DTO.EntryRequest;
import com.parking.management.Entity.Ticket;
import com.parking.management.Service.ParkingService;
import com.parking.management.Service.StaffService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/parking")
public class ParkingController {
    private final ParkingService parkingService;
    private final StaffService staffService;

    public ParkingController(
            ParkingService parkingService,
            StaffService staffService) {
        this.parkingService = parkingService;
        this.staffService = staffService;
    }

    @PostMapping("/entry")
    public Ticket enterVehicle(
            @Valid @RequestBody EntryRequest request) {

        return parkingService.enterVehicle(
                request.getPlateNumber(),
                request.getVehicleType(),
                request.getSlotType(),
                request.getSlotNumber(),
                staffService.getCurrentStaff()
        );
    }
}
