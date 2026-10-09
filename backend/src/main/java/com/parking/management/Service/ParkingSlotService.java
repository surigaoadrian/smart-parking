package com.parking.management.Service;

import com.parking.management.DTO.SlotLayoutRequest;
import com.parking.management.Entity.ParkingLot;
import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Enums.SlotStatus;
import com.parking.management.Enums.SlotType;
import com.parking.management.Repository.ParkingLotRepository;
import com.parking.management.Repository.ParkingSlotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ParkingSlotService {
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingLotRepository parkingLotRepository;

    public ParkingSlotService(
            ParkingSlotRepository parkingSlotRepository,
            ParkingLotRepository parkingLotRepository) {
        this.parkingSlotRepository = parkingSlotRepository;
        this.parkingLotRepository = parkingLotRepository;
    }

    public List<ParkingSlot> getAllSlots() {
        return parkingSlotRepository.findByActiveTrue();
    }

    public List<ParkingSlot> getAvailableSlots() {
        return parkingSlotRepository
                .findByStatusAndActiveTrue(SlotStatus.AVAILABLE);
    }

    public ParkingSlot findAvailableSlot(SlotType slotType) {
        return parkingSlotRepository
                .findFirstByStatusAndSlotTypeAndActiveTrueOrderByIdAsc(
                        SlotStatus.AVAILABLE,
                        slotType
                )
                .orElseThrow(() ->
                        new RuntimeException("No available parking slot")
                );
    }

    public ParkingSlot getAvailableSlot(
            String slotNumber,
            SlotType slotType) {

        ParkingSlot slot = parkingSlotRepository
                .findBySlotNumber(slotNumber)
                .filter(ParkingSlot::isActive)
                .orElseThrow(() ->
                        new RuntimeException("Parking slot not found")
                );

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new RuntimeException(
                    "Parking slot is not available"
            );
        }

        if (slotType != null && slot.getSlotType() != slotType) {
            throw new RuntimeException(
                    "Parking slot type does not match the vehicle"
            );
        }

        return slot;
    }

    public ParkingSlot occupySlot(ParkingSlot slot) {
        slot.setStatus(SlotStatus.OCCUPIED);

        return parkingSlotRepository.save(slot);
    }

    public ParkingSlot releaseSlot(ParkingSlot slot) {
        slot.setStatus(SlotStatus.AVAILABLE);

        return parkingSlotRepository.save(slot);
    }

    /**
     * Replaces the lot's layout with the given list of slots.
     * New slot numbers are created, existing ones are updated, and slots
     * missing from the list are retired (never deleted, tickets reference them).
     * Occupied slots cannot be removed, closed, or change type.
     */
    @Transactional
    public List<ParkingSlot> updateLayout(
            Long parkingLotId,
            List<SlotLayoutRequest> layout) {

        ParkingLot parkingLot = parkingLotRepository
                .findById(parkingLotId)
                .orElseThrow(() ->
                        badRequest("Parking lot not found")
                );

        if (layout == null || layout.isEmpty()) {
            throw badRequest("The layout must contain at least one slot");
        }

        // 1. Index every slot (including retired ones) by slot number
        Map<String, ParkingSlot> existing = new HashMap<>();

        for (ParkingSlot slot : parkingSlotRepository.findAll()) {
            existing.put(slot.getSlotNumber(), slot);
        }

        // 2. Create or update every slot in the requested layout
        Set<String> requested = new HashSet<>();

        for (SlotLayoutRequest item : layout) {
            String slotNumber = item.getSlotNumber() == null
                    ? ""
                    : item.getSlotNumber().trim().toUpperCase();

            if (slotNumber.isEmpty()) {
                throw badRequest("Every slot needs a slot number");
            }

            if (item.getSlotType() == null) {
                throw badRequest("Slot " + slotNumber + " needs a slot type");
            }

            if (!requested.add(slotNumber)) {
                throw badRequest("Slot " + slotNumber + " is listed twice");
            }

            SlotStatus wantedStatus = item.isClosed()
                    ? SlotStatus.OUT_OF_SERVICE
                    : SlotStatus.AVAILABLE;

            ParkingSlot slot = existing.get(slotNumber);

            if (slot == null) {
                slot = new ParkingSlot();
                slot.setSlotNumber(slotNumber);
                slot.setParkingLot(parkingLot);
                slot.setSlotType(item.getSlotType());
                slot.setStatus(wantedStatus);
                slot.setActive(true);

                parkingSlotRepository.save(slot);
                continue;
            }

            if (!slot.getParkingLot().getId().equals(parkingLotId)) {
                throw conflict("Slot " + slotNumber + " belongs to another parking lot");
            }

            if (slot.isActive() && slot.getStatus() == SlotStatus.OCCUPIED) {
                if (item.isClosed() || slot.getSlotType() != item.getSlotType()) {
                    throw conflict("Slot " + slotNumber + " is occupied and cannot be changed");
                }
                continue;
            }

            slot.setSlotType(item.getSlotType());
            slot.setStatus(wantedStatus);
            slot.setActive(true);

            parkingSlotRepository.save(slot);
        }

        // 3. Retire active slots of this lot that are no longer in the layout
        for (ParkingSlot slot : existing.values()) {
            boolean inThisLot = slot.getParkingLot().getId().equals(parkingLotId);

            if (!inThisLot || !slot.isActive() || requested.contains(slot.getSlotNumber())) {
                continue;
            }

            if (slot.getStatus() == SlotStatus.OCCUPIED) {
                throw conflict("Slot " + slot.getSlotNumber() + " is occupied and cannot be removed");
            }

            slot.setActive(false);
            parkingSlotRepository.save(slot);
        }

        return getAllSlots();
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
