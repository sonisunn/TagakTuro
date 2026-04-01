package com.example.demo.controller;

import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorApplicationRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private TutorApplicationRepository tutorApplicationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalStudents", studentRepository.count());
        stats.put("totalTutors", tutorRepository.count());
        stats.put("totalApplications", tutorApplicationRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        return ResponseEntity.ok(stats);
    }
}
