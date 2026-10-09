package com.parking.management.Controller;

import com.parking.management.DTO.PaymentRequest;
import com.parking.management.Entity.Payment;
import com.parking.management.Service.PaymentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(
            PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @PostMapping
    public Payment processPayment(
            @RequestBody PaymentRequest request) {

        return paymentService.processPayment(
                request.getTicketNumber(),
                request.getPaymentMethod()
        );
    }
}
