package com.example.demo.controller;

import com.example.demo.model.TutorAvailability;
import com.example.demo.service.TutorAvailabilityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tutor/availability")
@CrossOrigin(origins = "*")
public class TutorAvailabilityController {
    private final TutorAvailabilityService tutorAvailabilityService;

    public TutorAvailabilityController(TutorAvailabilityService tutorAvailabilityService) {
        this.tutorAvailabilityService = tutorAvailabilityService;
    }

    /**
     * Save or update a tutor availability slot
     * POST /api/tutor/availability
     * Body: { "tutorId": 1, "dayOfWeek": "MONDAY", "startTime": "14:00", "endTime":
     * "17:00" }
     */
    @PostMapping
    public ResponseEntity<?> saveAvailability(
            @RequestParam Long tutorId,
            @RequestParam String dayOfWeek,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        try {
            DayOfWeek day = DayOfWeek.valueOf(dayOfWeek.toUpperCase());
            LocalTime start = LocalTime.parse(startTime);
            LocalTime end = LocalTime.parse(endTime);

            TutorAvailability availability = tutorAvailabilityService
                    .saveAvailability(tutorId, day, start, end);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Availability saved successfully");
            response.put("data", formatAvailability(availability));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to save availability: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get all availability slots for a tutor
     * GET /api/tutor/availability/{tutorId}
     */
    @GetMapping("/{tutorId}")
    public ResponseEntity<?> getAvailability(@PathVariable Long tutorId) {
        try {
            List<TutorAvailability> availabilities = tutorAvailabilityService
                    .getAvailabilityByTutorId(tutorId);

            Map<String, Object> response = new HashMap<>();
            response.put("tutorId", tutorId);
            response.put("availabilityCount", availabilities.size());
            response.put("availabilities", availabilities.stream()
                    .map(this::formatAvailability)
                    .toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve availability: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get availability for a specific day of week
     * GET /api/tutor/availability/{tutorId}/day/{dayOfWeek}
     */
    @GetMapping("/{tutorId}/day/{dayOfWeek}")
    public ResponseEntity<?> getAvailabilityByDay(
            @PathVariable Long tutorId,
            @PathVariable String dayOfWeek) {
        try {
            DayOfWeek day = DayOfWeek.valueOf(dayOfWeek.toUpperCase());
            List<TutorAvailability> availabilities = tutorAvailabilityService
                    .getAvailabilityByTutorIdAndDay(tutorId, day);

            Map<String, Object> response = new HashMap<>();
            response.put("tutorId", tutorId);
            response.put("dayOfWeek", day);
            response.put("availabilities", availabilities.stream()
                    .map(this::formatAvailability)
                    .toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve availability: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Check if tutor is currently available
     * GET /api/tutor/availability/{tutorId}/is-available-now
     */
    @GetMapping("/{tutorId}/is-available-now")
    public ResponseEntity<?> isCurrentlyAvailable(@PathVariable Long tutorId) {
        try {
            boolean isAvailable = tutorAvailabilityService.isTutorCurrentlyAvailable(tutorId);
            boolean hasAvailabilitySet = tutorAvailabilityService.hasAvailabilitySet(tutorId);

            Map<String, Object> response = new HashMap<>();
            response.put("tutorId", tutorId);
            response.put("isCurrentlyAvailable", isAvailable);
            response.put("hasAvailabilitySet", hasAvailabilitySet);
            response.put("currentTime", LocalTime.now());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to check availability: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Delete an availability slot by ID
     * DELETE /api/tutor/availability/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAvailability(@PathVariable Long id) {
        try {
            tutorAvailabilityService.deleteAvailability(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Availability deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete availability: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Delete availability by tutor, day, and times
     * DELETE /api/tutor/availability/delete-slot
     */
    @DeleteMapping("/delete-slot")
    public ResponseEntity<?> deleteAvailabilityByDetails(
            @RequestParam Long tutorId,
            @RequestParam String dayOfWeek,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        try {
            DayOfWeek day = DayOfWeek.valueOf(dayOfWeek.toUpperCase());
            LocalTime start = LocalTime.parse(startTime);
            LocalTime end = LocalTime.parse(endTime);

            tutorAvailabilityService.deleteAvailabilityByDetails(tutorId, day, start, end);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Availability slot deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete availability: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Helper method to format availability data
    private Map<String, Object> formatAvailability(TutorAvailability av) {
        Map<String, Object> formatted = new HashMap<>();
        formatted.put("id", av.getId());
        formatted.put("dayOfWeek", av.getDayOfWeek().toString());
        formatted.put("startTime", av.getStartTime().toString());
        formatted.put("endTime", av.getEndTime().toString());
        return formatted;
    }
}
