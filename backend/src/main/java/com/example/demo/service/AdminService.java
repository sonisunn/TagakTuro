package com.example.demo.service;

import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorApplicationRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AdminService {

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

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalStudents", studentRepository.count());
        stats.put("totalTutors", tutorRepository.count());
        stats.put("totalApplications", tutorApplicationRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        return stats;
    }
}
