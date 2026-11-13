package com.parking.management.Exceptions;

import org.springframework.http.HttpStatus;

/** The user is logged in but not allowed to do this (wrong role, void window passed, ...). */
public class ForbiddenException extends ParkingException {

    public ForbiddenException(String message) {
        super(message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.FORBIDDEN;
    }
}
