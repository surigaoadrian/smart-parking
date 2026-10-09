package com.parking.management.DTO;

import com.parking.management.Enums.PaymentMethod;

public class PaymentRequest {
    private String ticketNumber;
    private PaymentMethod paymentMethod;

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
