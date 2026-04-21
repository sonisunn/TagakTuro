package com.example.demo.service;

import com.example.demo.model.Tutor;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TutorService {

    @Autowired
    private TutorRepository tutorRepository;

    // Get all tutors
    public List<Tutor> getAllTutors() {
        return tutorRepository.findAll();
    }

    // Get tutor by ID
    public Tutor getTutorById(Long id) {
        if (id == null) {
            throw new RuntimeException("Tutor ID cannot be null");
        }
        return tutorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tutor not found with id: " + id));
    }

    // Get tutor by email
    public Tutor getTutorByEmail(String email) {
        return tutorRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tutor not found with email: " + email));
    }

    // Get tutor by userId
    public Tutor getTutorByUserId(Long userId) {
        return tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Tutor not found with userId: " + userId));
    }

    // Delete a tutor
    public void deleteTutor(Long id) {
        if (id == null) {
            throw new RuntimeException("Tutor ID cannot be null");
        }
        Tutor tutor = getTutorById(id);
        tutorRepository.delete(tutor);
    }
}
