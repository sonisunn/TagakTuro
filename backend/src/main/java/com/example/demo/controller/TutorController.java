package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tutor")
public class TutorController {

    @GetMapping("/homepage")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<String> getTutorHomepage() {
        return ResponseEntity.ok("Welcome to the Tutor Homepage!");
    }
}
