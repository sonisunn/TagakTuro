package com.example.demo.controller;

import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.BookingRepository;
import com.example.demo.model.Tutor;
import com.example.demo.model.Booking;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Map<String, Object> summary = new HashMap<>();

        long totalStudents = studentRepository.count();
        long totalBookings = bookingRepository.count();

        // Active tutor = had a booking (any status) in the last 30 days.
        // Mirrors TutorService.INACTIVITY_THRESHOLD_DAYS so the dashboard count
        // matches the per-tutor badges on the Tutors page.
        LocalDateTime activityCutoff = LocalDateTime.now().minusDays(30);
        List<Tutor> tutors = tutorRepository.findAll();
        long totalActiveTutors = tutors.stream()
                .filter(t -> bookingRepository.findByTutorName(t.getName()).stream()
                        .anyMatch(b -> b.getBookingDateTime() != null
                                && b.getBookingDateTime().isAfter(activityCutoff)))
                .count();

        // Average rating of all tutors
        double avgRating = tutors.stream()
                .mapToDouble(t -> t.getRating() != null ? t.getRating() : 0.0)
                .average()
                .orElse(0.0);

        // Certificates issued
        long certsIssued = tutors.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsCertIssued()))
                .count();

        // Sessions this month
        LocalDateTime firstDayOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long sessionsThisMonth = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDateTime() != null && b.getBookingDateTime().isAfter(firstDayOfMonth))
                .count();

        // "totalTutors" is exposed as the count of *active* tutors so the
        // dashboard card labelled "Total Active Tutors" stops being misleading.
        // Legacy clients reading totalTutors as "all" still work; they'll just
        // see the active subset.
        summary.put("totalTutors", totalActiveTutors);
        summary.put("totalActiveTutors", totalActiveTutors);
        summary.put("totalAllTutors", tutors.size());
        summary.put("totalStudents", totalStudents);
        summary.put("totalBookings", totalBookings);
        summary.put("avgRating", avgRating);
        summary.put("certsIssued", certsIssued);
        summary.put("sessionsThisMonth", sessionsThisMonth);

        return ResponseEntity.ok(summary);
    }
}
