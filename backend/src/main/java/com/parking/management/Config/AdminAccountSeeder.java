package com.parking.management.Config;

import com.parking.management.Entity.Staff;
import com.parking.management.Enums.StaffRole;
import com.parking.management.Repository.StaffRepository;
import com.parking.management.Service.StaffService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first admin account when the staff table is empty, so the system
 * can be logged into right after installation. Username and password come from
 * ADMIN_USERNAME / ADMIN_PASSWORD (see backend/.env). Change the password after
 * the first login.
 */
@Component
public class AdminAccountSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminAccountSeeder.class);

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminAccountSeeder(
            StaffRepository staffRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.password}") String password) {

        this.staffRepository = staffRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (staffRepository.count() > 0) {
            // Installs from before the owner flag: protect the configured admin account.
            if (!staffRepository.existsByOwnerTrue()) {
                staffRepository.findByUsername(StaffService.normalizeUsername(username))
                        .ifPresent(existing -> {
                            existing.setOwner(true);
                            staffRepository.save(existing);
                            log.info("Marked '{}' as the main admin account.", existing.getUsername());
                        });
            }
            return;
        }

        Staff admin = new Staff();
        admin.setUsername(StaffService.normalizeUsername(username));
        admin.setFullName("Administrator");
        admin.setRole(StaffRole.ADMIN);
        admin.setActive(true);
        admin.setOwner(true);
        admin.setPasswordHash(passwordEncoder.encode(password));
        staffRepository.save(admin);

        log.warn("Created the first admin account '{}'. Log in and change its password.", admin.getUsername());
    }
}
