package com.parking.management.Controller;

import com.parking.management.DTO.ReportResponse;
import com.parking.management.Service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Revenue and activity reports. Admin only (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // GET /api/reports?from=2026-11-01&to=2026-11-13 (both dates inclusive)
    @GetMapping
    public ReportResponse getReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        return reportService.buildReport(from, to);
    }
}
