package com.parking.management.Controller;

import com.parking.management.DTO.PaymentRequest;
import com.parking.management.Entity.Payment;
import com.parking.management.Service.PaymentService;
import com.parking.management.Service.StaffService;
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
    private final StaffService staffService;

    public PaymentController(
            PaymentService paymentService,
            StaffService staffService) {
        this.paymentService = paymentService;
        this.staffService = staffService;
    }

    // Admins get all payments, attendants only the ones from today.
    @GetMapping
    public List<Payment> getPayments() {
        return paymentService.getPayments(staffService.getCurrentStaff());
    }

    @PostMapping
    public Payment processPayment(
            @RequestBody PaymentRequest request) {

        return paymentService.processPayment(
                request.getTicketNumber(),
                request.getPaymentMethod(),
                staffService.getCurrentStaff()
        );
    }
}
