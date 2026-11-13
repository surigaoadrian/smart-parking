package com.parking.management.Exceptions;

import org.springframework.http.HttpStatus;

/** The requested record (ticket, slot, parking lot, ...) does not exist. */
public class NotFoundException extends ParkingException {

    public NotFoundException(String message) {
        super(message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
