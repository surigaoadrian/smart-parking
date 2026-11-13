package com.parking.management.Config;

import com.parking.management.Entity.Staff;
import com.parking.management.Repository.StaffRepository;
import com.parking.management.Service.StaffService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Tells Spring Security how to load a staff account at login.
 * The role becomes a Spring authority: ADMIN -> ROLE_ADMIN, ATTENDANT -> ROLE_ATTENDANT.
 */
@Service
public class StaffUserDetailsService implements UserDetailsService {
    private final StaffRepository staffRepository;

    public StaffUserDetailsService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        Staff staff = staffRepository
                .findByUsername(StaffService.normalizeUsername(username))
                .orElseThrow(() -> new UsernameNotFoundException(username));

        return User.withUsername(staff.getUsername())
                .password(staff.getPasswordHash())
                .roles(staff.getRole().name())
                .disabled(!staff.isActive())
                .build();
    }
}
