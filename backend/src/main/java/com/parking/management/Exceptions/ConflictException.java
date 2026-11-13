package com.parking.management.Exceptions;

import org.springframework.http.HttpStatus;

/** The request is valid but clashes with the current state (slot taken, lot full, ticket already paid, ...). */
public class ConflictException extends ParkingException {

    public ConflictException(String message) {
        super(message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.CONFLICT;
    }
}
