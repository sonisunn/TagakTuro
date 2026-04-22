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
        
        long totalTutors = tutorRepository.count();
        long totalStudents = studentRepository.count();
        long totalBookings = bookingRepository.count();
        
        // Average rating of all tutors
        List<Tutor> tutors = tutorRepository.findAll();
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
                .filter(b -> b.getBookingDate() != null && b.getBookingDate().isAfter(firstDayOfMonth.toLocalDate().atStartOfDay()))
                .count();

        summary.put("totalTutors", totalTutors);
        summary.put("totalStudents", totalStudents);
        summary.put("totalBookings", totalBookings);
        summary.put("avgRating", avgRating);
        summary.put("certsIssued", certsIssued);
        summary.put("sessionsThisMonth", sessionsThisMonth);
        
        return ResponseEntity.ok(summary);
    }
}
