package com.parking.management.Controller;

import com.parking.management.DTO.SlotLayoutRequest;
import com.parking.management.Entity.ParkingLot;
import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Service.ParkingLotService;
import com.parking.management.Service.ParkingSlotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-lots")
public class ParkingLotController {
    private final ParkingLotService parkingLotService;
    private final ParkingSlotService parkingSlotService;

    public ParkingLotController(
            ParkingLotService parkingLotService,
            ParkingSlotService parkingSlotService) {

        this.parkingLotService = parkingLotService;
        this.parkingSlotService = parkingSlotService;
    }

    @GetMapping("/{id}")
    public ParkingLot getParkingLot(
            @PathVariable Long id) {

        return parkingLotService
                .getParkingLot(id);
    }

    @PutMapping("/{id}")
    public ParkingLot updateParkingLot(
            @PathVariable Long id,
            @RequestBody ParkingLot updatedParkingLot) {

        return parkingLotService
                .updateParkingLot(
                        id,
                        updatedParkingLot
                );
    }

    @PutMapping("/{id}/slots")
    public List<ParkingSlot> updateSlotLayout(
            @PathVariable Long id,
            @RequestBody List<SlotLayoutRequest> layout) {

        return parkingSlotService
                .updateLayout(
                        id,
                        layout
                );
    }
}
