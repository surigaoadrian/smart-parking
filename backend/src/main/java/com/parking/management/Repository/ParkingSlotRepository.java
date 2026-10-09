package com.parking.management.Repository;

import com.parking.management.Entity.ParkingSlot;
import com.parking.management.Enums.SlotStatus;
import com.parking.management.Enums.SlotType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findByStatus(SlotStatus status);
    List<ParkingSlot> findBySlotType(SlotType slotType);

    List<ParkingSlot> findByActiveTrue();

    List<ParkingSlot> findByStatusAndActiveTrue(SlotStatus status);

    Optional<ParkingSlot> findFirstByStatusAndSlotType(
            SlotStatus status,
            SlotType slotType
    );

    Optional<ParkingSlot> findFirstByStatusAndSlotTypeAndActiveTrueOrderByIdAsc(
            SlotStatus status,
            SlotType slotType
    );

    Optional<ParkingSlot> findBySlotNumber(String slotNumber);
}
