package com.parking.management.Controller;

import com.parking.management.DTO.CreateStaffRequest;
import com.parking.management.DTO.ResetPasswordRequest;
import com.parking.management.DTO.StaffResponse;
import com.parking.management.DTO.UpdateStaffRequest;
import com.parking.management.Service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Staff account management. Admin only (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/staff")
public class StaffController {
    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<StaffResponse> getAllStaff() {
        return staffService.getAllStaff()
                .stream()
                .map(staff -> StaffResponse.from(staff, staffService.getActivityCount(staff)))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse createStaff(
            @Valid @RequestBody CreateStaffRequest request) {

        return StaffResponse.from(staffService.createStaff(request));
    }

    @PatchMapping("/{id}")
    public StaffResponse updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRequest request) {

        return StaffResponse.from(
                staffService.updateStaff(id, request, staffService.getCurrentStaff()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id, staffService.getCurrentStaff());
    }

    @PostMapping("/{id}/reset-password")
    public Map<String, String> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request) {

        staffService.resetPassword(id, request.newPassword());
        return Map.of("message", "Password reset");
    }
}
