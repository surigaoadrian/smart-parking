package com.parking.management.Config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Writes 401/403 errors raised by the security filters in the same JSON shape
 * as GlobalExceptionHandler, so the frontend reads every error the same way.
 */
final class SecurityErrors {

    private SecurityErrors() {
    }

    static void write(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        String safeMessage = message.replace("\\", "\\\\").replace("\"", "\\\"");

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"timestamp\":\"" + LocalDateTime.now() + "\","
                        + "\"status\":" + status.value() + ","
                        + "\"error\":\"" + status.getReasonPhrase() + "\","
                        + "\"message\":\"" + safeMessage + "\"}"
        );
    }
}
