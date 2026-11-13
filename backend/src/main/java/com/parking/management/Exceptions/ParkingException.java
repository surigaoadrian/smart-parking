package com.parking.management.Exceptions;

import org.springframework.http.HttpStatus;

/**
 * Base class for every expected business error in the parking system
 * (lot full, ticket not found, slot taken, ...).
 * Each subclass decides which HTTP status the API answers with;
 * GlobalExceptionHandler turns it into a JSON error response.
 */
public abstract class ParkingException extends RuntimeException {

    protected ParkingException(String message) {
        super(message);
    }

    public abstract HttpStatus getStatus();
}
