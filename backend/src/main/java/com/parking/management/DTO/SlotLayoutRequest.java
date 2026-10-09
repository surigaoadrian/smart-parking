package com.parking.management.DTO;

import com.parking.management.Enums.SlotType;

// One slot in the desired layout sent by the Lot configuration screen.
public class SlotLayoutRequest {
    private String slotNumber;
    private SlotType slotType;
    private boolean closed;

    public String getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(String slotNumber) {
        this.slotNumber = slotNumber;
    }

    public SlotType getSlotType() {
        return slotType;
    }

    public void setSlotType(SlotType slotType) {
        this.slotType = slotType;
    }

    public boolean isClosed() {
        return closed;
    }

    public void setClosed(boolean closed) {
        this.closed = closed;
    }
}
