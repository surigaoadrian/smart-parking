package com.parking.management.DTO;

import com.parking.management.Enums.StaffRole;
import jakarta.validation.constraints.NotBlank;

/**
 * portal = which login page was used: ATTENDANT for /login, ADMIN for /admin.
 * The account's role must match it. Left out (e.g. from Postman), any role may log in.
 */
public record LoginRequest(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password,
        StaffRole portal) {
}
