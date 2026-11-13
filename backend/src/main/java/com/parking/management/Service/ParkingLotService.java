package com.parking.management.Service;

import com.parking.management.Exceptions.BadRequestException;
import com.parking.management.Exceptions.NotFoundException;
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
                        new NotFoundException(
                                "Parking lot " + id + " not found"
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

        Integer voidWindow = updatedParkingLot.getVoidWindowMinutes();
        if (voidWindow < 0 || voidWindow > 1440) {
            throw new BadRequestException(
                    "Attendant void window must be between 0 and 1440 minutes"
            );
        }
        parkingLot.setVoidWindowMinutes(voidWindow);

        return parkingLotRepository
                .save(parkingLot);
    }
}
