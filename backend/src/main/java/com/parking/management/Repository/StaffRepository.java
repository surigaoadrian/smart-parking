package com.parking.management.Repository;

import com.parking.management.Entity.Staff;
import com.parking.management.Enums.StaffRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByOwnerTrue();

    long countByRoleAndActiveTrue(StaffRole role);

    List<Staff> findAllByOrderByActiveDescFullNameAsc();
}
