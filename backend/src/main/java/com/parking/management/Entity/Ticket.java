package com.parking.management.Entity;

import com.parking.management.Enums.TicketStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ticketNumber;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "parking_slot_id", nullable = false)
    private ParkingSlot parkingSlot;

    @Column(nullable = false)
    private LocalDateTime entryTime;

    private LocalDateTime exitTime;

    // Why the ticket was voided (only set when status is VOIDED).
    private String voidReason;

    // Staff member who issued the ticket at the gate (null for tickets made before login existed).
    @ManyToOne
    @JoinColumn(name = "issued_by_id")
    private Staff issuedBy;

    // Staff member who voided the ticket (only set when status is VOIDED).
    @ManyToOne
    @JoinColumn(name = "voided_by_id")
    private Staff voidedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;

    public Ticket() {
    }

    public Long getId() {
        return id;
    }


    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public ParkingSlot getParkingSlot() {
        return parkingSlot;
    }

    public void setParkingSlot(ParkingSlot parkingSlot) {
        this.parkingSlot = parkingSlot;
    }

    public LocalDateTime getEntryTime() {
        return entryTime;
    }

    public void setEntryTime(LocalDateTime entryTime) {
        this.entryTime = entryTime;
    }

    public LocalDateTime getExitTime() {
        return exitTime;
    }

    public void setExitTime(LocalDateTime exitTime) {
        this.exitTime = exitTime;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public String getVoidReason() {
        return voidReason;
    }

    public void setVoidReason(String voidReason) {
        this.voidReason = voidReason;
    }

    public Staff getIssuedBy() {
        return issuedBy;
    }

    public void setIssuedBy(Staff issuedBy) {
        this.issuedBy = issuedBy;
    }

    public Staff getVoidedBy() {
        return voidedBy;
    }

    public void setVoidedBy(Staff voidedBy) {
        this.voidedBy = voidedBy;
    }
}
