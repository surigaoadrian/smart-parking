package com.parking.management.DTO;

import com.parking.management.Enums.SlotType;
import com.parking.management.Enums.VehicleType;

public class EntryRequest {
    private String plateNumber;
    private VehicleType vehicleType;
    private SlotType slotType;
    // Optional: the slot picked by the attendant. When empty, the first free slot of slotType is used.
    private String slotNumber;

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public SlotType getSlotType() {
        return slotType;
    }

    public void setSlotType(SlotType slotType) {
        this.slotType = slotType;
    }

    public String getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(String slotNumber) {
        this.slotNumber = slotNumber;
    }
}
