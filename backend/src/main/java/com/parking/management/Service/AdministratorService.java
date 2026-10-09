package com.parking.management.Service;

import com.parking.management.Entity.Administrator;
import com.parking.management.Repository.AdministratorRepository;
import org.springframework.stereotype.Service;

@Service
public class AdministratorService {
    private final AdministratorRepository administratorRepository;

    public AdministratorService(
            AdministratorRepository administratorRepository) {
        this.administratorRepository = administratorRepository;
    }

    public Administrator findByUsername(String username) {
        return administratorRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Administrator not found")
                );
    }
}
