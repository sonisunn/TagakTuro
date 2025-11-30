package com.example.demo.controller;

import com.example.demo.service.TutorApplicationService;
import com.example.demo.model.TutorApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tutor")
public class TutorApplicationController {

    private final TutorApplicationService tutorApplicationService;

    public TutorApplicationController(TutorApplicationService tutorApplicationService) {
        this.tutorApplicationService = tutorApplicationService;
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyAsTutor(
            @RequestParam("name") String name,
            @RequestParam("studentId") String studentId,
            @RequestParam("courseProgram") String courseProgram,
            @RequestParam("email") String email,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("password") String password,
            @RequestParam("experience") String experience,
            @RequestParam("reportOfGrades") MultipartFile reportOfGrades,
            @RequestParam(value = "certificates", required = false) MultipartFile certificates) {

        try {
            TutorApplicationRequest request = new TutorApplicationRequest(
                    name, studentId, courseProgram, email, phoneNumber, password,
                    experience
            );
            tutorApplicationService.apply(request, reportOfGrades, certificates);
            return ResponseEntity.ok(Map.of("message", "Application submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/applications")
    public ResponseEntity<List<TutorApplication>> getAllApplications() {
        List<TutorApplication> applications = tutorApplicationService.getAllApplications();
        return ResponseEntity.ok(applications);
    }

    @PostMapping("/applications/{id}/accept")
    public ResponseEntity<?> acceptApplication(@PathVariable Long id) {
        try {
            tutorApplicationService.acceptApplication(id);
            return ResponseEntity.ok(Map.of("message", "Application accepted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/applications/accept-all")
    public ResponseEntity<?> acceptAllApplications() {
        try {
            tutorApplicationService.acceptAllApplications();
            return ResponseEntity.ok(Map.of("message", "All applications accepted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
