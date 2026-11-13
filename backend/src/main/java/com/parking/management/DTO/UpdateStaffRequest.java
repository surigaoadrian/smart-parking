package com.parking.management.DTO;

import com.parking.management.Enums.StaffRole;
import jakarta.validation.constraints.Size;

/** Partial update: any field left null is not changed. */
public record UpdateStaffRequest(
        @Size(min = 1, max = 100, message = "Full name must be 1-100 characters")
        String fullName,
        StaffRole role,
        Boolean active) {
}
