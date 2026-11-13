package com.parking.management.DTO;

import com.parking.management.Entity.Staff;
import com.parking.management.Enums.StaffRole;

import java.time.LocalDateTime;

/** What the API shares about a staff account (never the password hash). */
public record StaffResponse(
        Long id,
        String username,
        String fullName,
        StaffRole role,
        boolean active,
        LocalDateTime createdAt,
        boolean owner,
        long activityCount) {

    /** For places that don't need the activity count (login, /me). */
    public static StaffResponse from(Staff staff) {
        return from(staff, 0);
    }

    /** activityCount = tickets issued or voided + payments taken; only accounts with 0 can be deleted. */
    public static StaffResponse from(Staff staff, long activityCount) {
        return new StaffResponse(
                staff.getId(),
                staff.getUsername(),
                staff.getFullName(),
                staff.getRole(),
                staff.isActive(),
                staff.getCreatedAt(),
                staff.isOwner(),
                activityCount);
    }
}
