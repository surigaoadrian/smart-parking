package com.parking.management.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.parking.management.Enums.StaffRole;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A person who logs in to the system: an attendant at the gate or an administrator.
 * Accounts are deactivated, never deleted, because tickets and payments keep a
 * reference to the staff member who handled them.
 */
@Entity
@Table(name = "staff")
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    // BCrypt hash, never the plain password. Never sent to the frontend.
    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole role;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // The main admin account created at installation. It cannot be deleted,
    // deactivated or demoted, so the system can never be locked out.
    // Nullable so rows created before this column existed still load.
    private Boolean owner;

    public Staff() {
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @JsonIgnore
    public boolean isAdmin() {
        return role == StaffRole.ADMIN;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    @JsonIgnore
    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public StaffRole getRole() {
        return role;
    }

    public void setRole(StaffRole role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public boolean isOwner() {
        return Boolean.TRUE.equals(owner);
    }

    public void setOwner(boolean owner) {
        this.owner = owner;
    }
}
