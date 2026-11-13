package com.parking.management.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VoidRequest {
    @NotBlank(message = "A reason is required to void a ticket")
    @Size(max = 255, message = "Reason must be at most 255 characters")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
