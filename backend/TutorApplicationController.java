package com.example.demo.tutor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
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

class TutorApplicationRequest {
    private String name;
    private String studentId;
    private String courseProgram;
    private String email;
    private String phoneNumber;
    private String password;
    private String experience;
    private String timeAvailableStart;
    private String timeAvailableEnd;

    public TutorApplicationRequest(String name, String studentId, String courseProgram, String email, String phoneNumber, String password, String experience, String timeAvailableStart, String timeAvailableEnd) {
        this.name = name;
        this.studentId = studentId;
        this.courseProgram = courseProgram;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.password = password;
        this.experience = experience;
        this.timeAvailableStart = timeAvailableStart;
        this.timeAvailableEnd = timeAvailableEnd;
    }

    // Getters
    public String getName() { return name; }
    public String getStudentId() { return studentId; }
    public String getCourseProgram() { return courseProgram; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getPassword() { return password; }
    public String getExperience() { return experience; }
    public String getTimeAvailableStart() { return timeAvailableStart; }
    public String getTimeAvailableEnd() { return timeAvailableEnd; }
}