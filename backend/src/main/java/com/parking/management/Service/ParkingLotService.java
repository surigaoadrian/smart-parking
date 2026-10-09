package com.parking.management.Service;

import com.parking.management.Entity.ParkingLot;
import com.parking.management.Repository.ParkingLotRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ParkingLotService {
    private final ParkingLotRepository parkingLotRepository;

    public ParkingLotService(
            ParkingLotRepository parkingLotRepository) {

        this.parkingLotRepository =
                parkingLotRepository;
    }

    public List<ParkingLot> getAllParkingLots() {
        return parkingLotRepository.findAll();
    }

    public ParkingLot getParkingLot(Long id) {

        return parkingLotRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Parking lot not found"
                        )
                );
    }

    public ParkingLot updateParkingLot(
            Long id,
            ParkingLot updatedParkingLot) {

        ParkingLot parkingLot =
                getParkingLot(id);

        parkingLot.setName(
                updatedParkingLot.getName()
        );

        parkingLot.setLocation(
                updatedParkingLot.getLocation()
        );

        parkingLot.setFirstHourRate(
                updatedParkingLot
                        .getFirstHourRate()
        );

        parkingLot.setSucceedingHourRate(
                updatedParkingLot
                        .getSucceedingHourRate()
        );

        parkingLot.setOverstayAfterHours(
                updatedParkingLot
                        .getOverstayAfterHours()
        );

        return parkingLotRepository
                .save(parkingLot);
    }
}
