package com.parking.management.Service;

import com.parking.management.DTO.CreateStaffRequest;
import com.parking.management.DTO.UpdateStaffRequest;
import com.parking.management.Entity.Staff;
import com.parking.management.Enums.StaffRole;
import com.parking.management.Exceptions.BadRequestException;
import com.parking.management.Exceptions.ConflictException;
import com.parking.management.Exceptions.NotFoundException;
import com.parking.management.Exceptions.UnauthorizedException;
import com.parking.management.Repository.PaymentRepository;
import com.parking.management.Repository.StaffRepository;
import com.parking.management.Repository.TicketRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StaffService {
    private final StaffRepository staffRepository;
    private final TicketRepository ticketRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffService(
            StaffRepository staffRepository,
            TicketRepository ticketRepository,
            PaymentRepository paymentRepository,
            PasswordEncoder passwordEncoder) {

        this.staffRepository = staffRepository;
        this.ticketRepository = ticketRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Tickets issued or voided plus payments taken by this staff member. */
    public long getActivityCount(Staff staff) {
        return ticketRepository.countByIssuedByOrVoidedBy(staff, staff)
                + paymentRepository.countByProcessedBy(staff);
    }

    /** The staff member who sent the current request. */
    public Staff getCurrentStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Please log in");
        }

        return staffRepository
                .findByUsername(auth.getName())
                .filter(Staff::isActive)
                .orElseThrow(() ->
                        new UnauthorizedException("Your session is no longer valid. Please log in again")
                );
    }

    public List<Staff> getAllStaff() {
        return staffRepository.findAllByOrderByActiveDescFullNameAsc();
    }

    @Transactional
    public Staff createStaff(CreateStaffRequest request) {
        String username = normalizeUsername(request.username());

        if (staffRepository.existsByUsername(username)) {
            throw new ConflictException("Username " + username + " is already taken");
        }

        Staff staff = new Staff();
        staff.setUsername(username);
        staff.setFullName(request.fullName().trim());
        staff.setRole(request.role());
        staff.setActive(true);
        staff.setPasswordHash(passwordEncoder.encode(request.password()));

        return staffRepository.save(staff);
    }

    @Transactional
    public Staff updateStaff(Long id, UpdateStaffRequest request, Staff currentUser) {
        Staff staff = getStaff(id);
        boolean isSelf = staff.getId().equals(currentUser.getId());

        boolean deactivating = Boolean.FALSE.equals(request.active()) && staff.isActive();
        boolean demoting = request.role() == StaffRole.ATTENDANT && staff.isAdmin();

        // The main admin account always stays an active admin.
        if (staff.isOwner() && (deactivating || demoting)) {
            throw new BadRequestException("The main admin account cannot be deactivated or demoted");
        }

        // Never let an admin lock themselves out.
        if (isSelf && (deactivating || demoting)) {
            throw new BadRequestException("You cannot deactivate or demote your own account");
        }

        // There must always be at least one active admin left.
        if ((deactivating || demoting) && staff.isAdmin()
                && staffRepository.countByRoleAndActiveTrue(StaffRole.ADMIN) <= 1) {
            throw new ConflictException("At least one active admin account is required");
        }

        if (request.fullName() != null) {
            staff.setFullName(request.fullName().trim());
        }
        if (request.role() != null) {
            staff.setRole(request.role());
        }
        if (request.active() != null) {
            staff.setActive(request.active());
        }

        return staffRepository.save(staff);
    }

    /**
     * Permanently removes an account. Only allowed when it has no recorded activity
     * (e.g. created by mistake); otherwise tickets and payments would lose who handled them,
     * so the account must be deactivated instead.
     */
    @Transactional
    public void deleteStaff(Long id, Staff currentUser) {
        Staff staff = getStaff(id);

        if (staff.isOwner()) {
            throw new BadRequestException("The main admin account cannot be deleted");
        }
        if (staff.getId().equals(currentUser.getId())) {
            throw new BadRequestException("You cannot delete your own account");
        }

        long activity = getActivityCount(staff);
        if (activity > 0) {
            throw new ConflictException(staff.getFullName() + " has handled " + activity
                    + (activity == 1 ? " ticket or payment" : " tickets or payments")
                    + ", so the account is kept for the records. Deactivate it instead");
        }

        staffRepository.delete(staff);
    }

    /** Admin sets a new password for someone who forgot theirs. */
    @Transactional
    public void resetPassword(Long id, String newPassword) {
        Staff staff = getStaff(id);
        staff.setPasswordHash(passwordEncoder.encode(newPassword));
        staffRepository.save(staff);
    }

    /** Any staff member changes their own password. */
    @Transactional
    public void changeOwnPassword(Staff staff, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, staff.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (currentPassword.equals(newPassword)) {
            throw new BadRequestException("New password must be different from the current one");
        }

        staff.setPasswordHash(passwordEncoder.encode(newPassword));
        staffRepository.save(staff);
    }

    private Staff getStaff(Long id) {
        return staffRepository
                .findById(id)
                .orElseThrow(() ->
                        new NotFoundException("Staff account " + id + " not found")
                );
    }

    // Usernames are case-insensitive: "Juan.Cruz" and "juan.cruz" are the same account.
    public static String normalizeUsername(String username) {
        return username.trim().toLowerCase();
    }
}
