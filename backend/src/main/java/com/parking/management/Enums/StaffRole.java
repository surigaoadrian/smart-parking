package com.parking.management.Enums;

public enum StaffRole {
    // Full access: settings, staff accounts, void any ticket, all payments
    ADMIN,
    // Gate work: entry, checkout, payments for today, void recent tickets only
    ATTENDANT
}
