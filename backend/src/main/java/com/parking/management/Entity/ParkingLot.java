package com.parking.management.Entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "parking_lots")
public class ParkingLot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String location;

    @Column(nullable = false)
    private BigDecimal firstHourRate;

    @Column(nullable = false)
    private BigDecimal succeedingHourRate;

    @Column(nullable = false)
    private Integer overstayAfterHours;

    public ParkingLot() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public BigDecimal getFirstHourRate() {
        return firstHourRate;
    }

    public void setFirstHourRate(BigDecimal firstHourRate) {
        this.firstHourRate = firstHourRate;
    }

    public BigDecimal getSucceedingHourRate() {
        return succeedingHourRate;
    }

    public void setSucceedingHourRate(BigDecimal succeedingHourRate) {
        this.succeedingHourRate = succeedingHourRate;
    }

    public Integer getOverstayAfterHours() {
        return overstayAfterHours;
    }

    public void setOverstayAfterHours(Integer overstayAfterHours) {
        this.overstayAfterHours = overstayAfterHours;
    }
}
