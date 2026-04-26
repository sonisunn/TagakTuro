package com.example.demo.service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Tutor;
import com.example.demo.model.TutorAvailability;
import com.example.demo.repository.TutorAvailabilityRepository;
import com.example.demo.repository.TutorRepository;

@Service
public class TutorAvailabilityService {
    private final TutorAvailabilityRepository availabilityRepository;
    private final TutorRepository tutorRepository;

    public TutorAvailabilityService(TutorAvailabilityRepository availabilityRepository,
            TutorRepository tutorRepository) {
        this.availabilityRepository = availabilityRepository;
        this.tutorRepository = tutorRepository;
    }

    /**
     * Save or update a tutor availability slot
     */
    @Transactional
    public TutorAvailability saveAvailability(Long tutorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Tutor not found with id: " + tutorId));

        // Validate times
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        // Check if slot already exists for this day
        Optional<TutorAvailability> existing = availabilityRepository
                .findByTutorIdAndDayOfWeekAndStartTimeAndEndTime(tutorId, dayOfWeek, startTime, endTime);

        if (existing.isPresent()) {
            return existing.get(); // Already exists, no need to update
        }

        TutorAvailability availability = new TutorAvailability(tutor, dayOfWeek, startTime, endTime);
        return availabilityRepository.save(availability);
    }

    /**
     * Get all availability slots for a tutor
     */
    @Transactional(readOnly = true)
    public List<TutorAvailability> getAvailabilityByTutorId(Long tutorId) {
        return availabilityRepository.findByTutorId(tutorId);
    }

    /**
     * Get availability slots for a specific day of week
     */
    @Transactional(readOnly = true)
    public List<TutorAvailability> getAvailabilityByTutorIdAndDay(Long tutorId, DayOfWeek dayOfWeek) {
        return availabilityRepository.findByTutorIdAndDayOfWeek(tutorId, dayOfWeek);
    }

    /**
     * Delete an availability slot
     */
    @Transactional
    public void deleteAvailability(Long availabilityId) {
        availabilityRepository.deleteById(availabilityId);
    }

    /**
     * Delete specific availability by tutor, day, and times
     */
    @Transactional
    public void deleteAvailabilityByDetails(Long tutorId, DayOfWeek dayOfWeek,
            LocalTime startTime, LocalTime endTime) {
        availabilityRepository.deleteByTutorIdAndDayOfWeekAndStartTimeAndEndTime(
                tutorId, dayOfWeek, startTime, endTime);
    }

    /**
     * Check if a tutor is currently available (at the current time)
     * Uses the device's local time for comparison
     */
    @Transactional(readOnly = true)
    public boolean isTutorCurrentlyAvailable(Long tutorId) {
        List<TutorAvailability> availabilities = availabilityRepository.findByTutorId(tutorId);

        if (availabilities.isEmpty()) {
            return false; // No availability set
        }

        LocalTime currentTime = LocalTime.now();
        DayOfWeek currentDay = DayOfWeek.of(ZonedDateTime.now().getDayOfWeek().getValue());

        return availabilities.stream()
                .anyMatch(av -> av.getDayOfWeek().equals(currentDay)
                        && !currentTime.isBefore(av.getStartTime())
                        && currentTime.isBefore(av.getEndTime()));
    }

    /**
     * Check if a tutor has any availability slots set
     */
    @Transactional(readOnly = true)
    public boolean hasAvailabilitySet(Long tutorId) {
        return availabilityRepository.existsByTutorId(tutorId);
    }

    /**
     * Check if a specific time falls within any of the tutor's availability windows
     * Useful for scheduling/matching logic
     */
    @Transactional(readOnly = true)
    public boolean isTimeWithinAvailability(Long tutorId, ZonedDateTime dateTime) {
        LocalTime timeToCheck = dateTime.toLocalTime();
        DayOfWeek dayToCheck = DayOfWeek.of(dateTime.getDayOfWeek().getValue());

        List<TutorAvailability> availabilities = availabilityRepository
                .findByTutorIdAndDayOfWeek(tutorId, dayToCheck);

        return availabilities.stream()
                .anyMatch(av -> !timeToCheck.isBefore(av.getStartTime())
                        && timeToCheck.isBefore(av.getEndTime()));
    }
}
