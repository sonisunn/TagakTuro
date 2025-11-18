package com.example.demo.tutor;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class TutorApplicationService {

    private final TutorApplicationRepository tutorApplicationRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    public TutorApplicationService(TutorApplicationRepository tutorApplicationRepository, BCryptPasswordEncoder passwordEncoder, FileStorageService fileStorageService) {
        this.tutorApplicationRepository = tutorApplicationRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    public TutorApplication apply(TutorApplicationRequest request, MultipartFile reportOfGrades, MultipartFile certificates) {
        if (tutorApplicationRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already used for an application.");
        }

        TutorApplication application = new TutorApplication();
        application.setName(request.getName());
        application.setStudentId(request.getStudentId());
        application.setCourseProgram(request.getCourseProgram());
        application.setEmail(request.getEmail());
        application.setPhoneNumber(request.getPhoneNumber());
        application.setPassword(passwordEncoder.encode(request.getPassword()));
        application.setExperience(request.getExperience());

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
        application.setTimeAvailableStart(LocalTime.parse(request.getTimeAvailableStart(), timeFormatter));
        application.setTimeAvailableEnd(LocalTime.parse(request.getTimeAvailableEnd(), timeFormatter));

        String reportOfGradesPath = fileStorageService.storeFile(reportOfGrades);
        application.setReportOfGradesPath(reportOfGradesPath);

        if (certificates != null && !certificates.isEmpty()) {
            String certificatesPath = fileStorageService.storeFile(certificates);
            application.setCertificatesPath(certificatesPath);
        }

        return tutorApplicationRepository.save(application);
    }
}