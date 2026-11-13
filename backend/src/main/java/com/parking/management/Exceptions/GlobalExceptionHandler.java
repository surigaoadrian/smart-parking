package com.parking.management.Exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Turns every error into the same small JSON body:
 * { "timestamp": ..., "status": 409, "error": "Conflict", "message": "No available MOTORCYCLE slot" }
 * The frontend shows "message" to the attendant.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Our own business errors: NotFound / Conflict / BadRequest.
    @ExceptionHandler(ParkingException.class)
    public ResponseEntity<Map<String, Object>> handleParking(ParkingException ex) {
        return body(ex.getStatus(), ex.getMessage());
    }

    // @Valid failures on request DTOs, e.g. "Plate number is required".
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));

        return body(HttpStatus.BAD_REQUEST, message);
    }

    // Broken JSON or an unknown enum value such as "vehicleType": "BUS".
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        return body(HttpStatus.BAD_REQUEST, "The request body is missing or has an invalid value");
    }

    // A query parameter in the wrong format, e.g. ?from=13-11-2026 instead of 2026-11-13.
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return body(HttpStatus.BAD_REQUEST, "Invalid value for '" + ex.getName() + "'");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleOther(Exception ex) {
        // Spring's own web errors (unknown URL -> 404, wrong HTTP method -> 405, ...).
        // Keep their status so the frontend can tell a missing endpoint apart.
        if (ex instanceof ErrorResponse error) {
            String detail = error.getBody().getDetail();

            return body(error.getStatusCode(), detail != null ? detail : ex.getMessage());
        }

        // Anything else is a real bug: log the stack trace on the server,
        // but only send a short message to the client.
        log.error("Unexpected error", ex);

        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on the server");
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatusCode status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status instanceof HttpStatus s ? s.getReasonPhrase() : String.valueOf(status.value()));
        body.put("message", message);

        return ResponseEntity.status(status).body(body);
    }
}
