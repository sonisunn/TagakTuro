package com.example.demo.repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.TutorAvailability;

@Repository
public interface TutorAvailabilityRepository extends JpaRepository<TutorAvailability, Long> {
    /**
     * Find all availability slots for a specific tutor
     */
    List<TutorAvailability> findByTutorId(Long tutorId);

    /**
     * Find availability by tutor and day of week
     */
    List<TutorAvailability> findByTutorIdAndDayOfWeek(Long tutorId, DayOfWeek dayOfWeek);

    /**
     * Find specific slot by tutor, day, start time and end time
     */
    Optional<TutorAvailability> findByTutorIdAndDayOfWeekAndStartTimeAndEndTime(
            Long tutorId,
            DayOfWeek dayOfWeek,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime);

    /**
     * Delete a specific availability slot
     */
    void deleteByTutorIdAndDayOfWeekAndStartTimeAndEndTime(
            Long tutorId,
            DayOfWeek dayOfWeek,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime);

    /**
     * Check if tutor has any availability set
     */
    boolean existsByTutorId(Long tutorId);
}
