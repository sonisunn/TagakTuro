package com.example.demo.controller;

import com.example.demo.model.Tutor;
import com.example.demo.service.TutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tutor")
@CrossOrigin(origins = "*")
public class TutorController {

    @Autowired
    private TutorService tutorService;

    // Get all tutors
    @GetMapping
    public ResponseEntity<List<Tutor>> getAllTutors() {
        try {
            List<Tutor> tutors = tutorService.getAllTutors();
            return ResponseEntity.ok(tutors);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get tutor by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getTutorById(@PathVariable Long id) {
        try {
            Tutor tutor = tutorService.getTutorById(id);
            return ResponseEntity.ok(tutor);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred while retrieving the tutor"));
        }
    }

    @GetMapping("/homepage")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<String> getTutorHomepage() {
        return ResponseEntity.ok("Welcome to the Tutor Homepage!");
    }

    // Delete a tutor
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTutor(@PathVariable Long id) {
        try {
            tutorService.deleteTutor(id);
            return ResponseEntity.ok(Map.of("message", "Tutor deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred while deleting the tutor"));
        }
    }
}
