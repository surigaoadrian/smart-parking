package com.parking.management.Exceptions;

import org.springframework.http.HttpStatus;

/** Login failed, or the session is missing or no longer valid. */
public class UnauthorizedException extends ParkingException {

    public UnauthorizedException(String message) {
        super(message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNAUTHORIZED;
    }
}
