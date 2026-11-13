package com.parking.management.DTO;

import com.parking.management.Enums.StaffRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be at most 100 characters")
        String fullName,

        @NotBlank(message = "Username is required")
        @Pattern(regexp = "^[A-Za-z0-9._-]{3,30}$",
                message = "Username must be 3-30 characters: letters, numbers, dot, dash or underscore")
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
        String password,

        @NotNull(message = "Role is required")
        StaffRole role) {
}
