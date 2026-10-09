package com.parking.management.Service;

import com.parking.management.Entity.Vehicle;
import com.parking.management.Enums.VehicleType;
import com.parking.management.Repository.VehicleRepository;
import org.springframework.stereotype.Service;

@Service
public class VehicleService {
    private final VehicleRepository vehicleRepository;

    public VehicleService(
            VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public Vehicle getOrCreateVehicle(
            String plateNumber,
            VehicleType vehicleType) {

        return vehicleRepository
                .findByPlateNumber(plateNumber)
                .orElseGet(() -> {
                    Vehicle vehicle = new Vehicle();

                    vehicle.setPlateNumber(plateNumber);
                    vehicle.setVehicleType(vehicleType);

                    return vehicleRepository.save(vehicle);
                });
    }
}
