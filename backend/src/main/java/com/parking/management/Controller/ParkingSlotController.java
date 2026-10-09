package com.parking.management.Controller;

import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Service.ParkingSlotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
public class ParkingSlotController {
    private final ParkingSlotService parkingSlotService;

    public ParkingSlotController(
            ParkingSlotService parkingSlotService) {
        this.parkingSlotService = parkingSlotService;
    }

    @GetMapping
    public List<ParkingSlot> getAllSlots() {
        return parkingSlotService.getAllSlots();
    }

    @GetMapping("/available")
    public List<ParkingSlot> getAvailableSlots() {
        return parkingSlotService.getAvailableSlots();
    }
}
