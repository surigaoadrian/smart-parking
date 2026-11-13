package com.parking.management.Exceptions;

import org.springframework.http.HttpStatus;

/** The request itself is invalid (wrong slot type, malformed layout, ...). */
public class BadRequestException extends ParkingException {

    public BadRequestException(String message) {
        super(message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.BAD_REQUEST;
    }
}
