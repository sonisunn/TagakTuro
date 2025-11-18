package com.example.demo.controller;

import com.example.demo.service.TutorApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
            @RequestParam("timeAvailableStart") String timeAvailableStart,
            @RequestParam("timeAvailableEnd") String timeAvailableEnd,
            @RequestParam("reportOfGrades") MultipartFile reportOfGrades,
            @RequestParam(value = "certificates", required = false) MultipartFile certificates) {

        try {
            TutorApplicationRequest request = new TutorApplicationRequest(
                    name, studentId, courseProgram, email, phoneNumber, password,
                    experience, timeAvailableStart, timeAvailableEnd
            );
            tutorApplicationService.apply(request, reportOfGrades, certificates);
            return ResponseEntity.ok(Map.of("message", "Application submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
