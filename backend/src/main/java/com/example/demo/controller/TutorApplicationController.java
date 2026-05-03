package com.example.demo.controller;

import com.example.demo.service.TutorApplicationService;
import com.example.demo.model.TutorApplication;
import com.example.demo.dto.TutorApplicationRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tutor")
public class TutorApplicationController {

    private final TutorApplicationService tutorApplicationService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public TutorApplicationController(TutorApplicationService tutorApplicationService) {
        this.tutorApplicationService = tutorApplicationService;
    }

    @GetMapping("/check-student-id")
    public ResponseEntity<Map<String, Boolean>> checkStudentId(@RequestParam String studentId) {
        boolean taken = tutorApplicationService.isStudentIdTaken(studentId);
        return ResponseEntity.ok(Map.of("taken", taken));
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

    @PostMapping("/applications/{id}/reject")
    public ResponseEntity<?> rejectApplication(@PathVariable Long id) {
        try {
            tutorApplicationService.rejectApplication(id);
            return ResponseEntity.ok(Map.of("message", "Application rejected successfully"));
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

    @GetMapping("/applications/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable Long id, @RequestParam String fileType) {
        try {
            TutorApplication application = tutorApplicationService.getApplicationById(id);
            if (application == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Application not found"));
            }

            String filePath = null;
            String fileName = null;

            if ("report".equalsIgnoreCase(fileType)) {
                filePath = application.getReportOfGradesPath();
                fileName = "Report_of_Grades_" + application.getName().replaceAll(" ", "_") + ".pdf";
            } else if ("certificate".equalsIgnoreCase(fileType)) {
                filePath = application.getCertificatesPath();
                fileName = "Certificates_" + application.getName().replaceAll(" ", "_") + ".pdf";
            }

            if (filePath == null) {
                return ResponseEntity.status(404).body(Map.of("error", "File not found"));
            }

            // Try resolving relative to uploadDir first
            Path file = Paths.get(uploadDir, filePath);
            
            // If not found, and filePath starts with uploadDir, try filePath directly
            if (!Files.exists(file) && filePath.startsWith(uploadDir + "/")) {
                file = Paths.get(filePath);
            }
            
            // If still not found, try stripping uploadDir if it was doubled
            if (!Files.exists(file) && filePath.contains("/")) {
                // Handle cases like "uploads/grades/file.pdf" when uploadDir is "uploads"
                String strippedPath = filePath.startsWith(uploadDir + "/") 
                    ? filePath.substring(uploadDir.length() + 1) 
                    : filePath;
                file = Paths.get(uploadDir, strippedPath);
            }

            if (!Files.exists(file)) {
                return ResponseEntity.status(404).body(Map.of("error", "File does not exist: " + filePath));
            }

            byte[] fileContent = Files.readAllBytes(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(fileContent);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error reading file: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error: " + e.getMessage()));
        }
    }
}
