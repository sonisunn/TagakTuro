package com.example.demo.service;

import com.example.demo.controller.TutorApplicationRequest;
import com.example.demo.model.TutorApplication;
import com.example.demo.model.User;
import com.example.demo.model.Tutor;
import com.example.demo.repository.TutorApplicationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.TutorRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
public class TutorApplicationService {

    private final TutorApplicationRepository tutorApplicationRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;

    public TutorApplicationService(TutorApplicationRepository tutorApplicationRepository,
                                   BCryptPasswordEncoder passwordEncoder,
                                   FileStorageService fileStorageService,
                                   UserRepository userRepository,
                                   TutorRepository tutorRepository) {
        this.tutorApplicationRepository = tutorApplicationRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.tutorRepository = tutorRepository;
    }

    public TutorApplication apply(TutorApplicationRequest request, MultipartFile reportOfGrades, MultipartFile certificates) {
        if (tutorApplicationRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already used for an application.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already registered as a user.");
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

        TutorApplication savedApplication = tutorApplicationRepository.save(application);

        // Create a new User for the tutor
        User newUser = new User();
        newUser.setName(request.getName());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setRoles(Collections.singleton("ROLE_TUTOR"));
        userRepository.save(newUser);

        // Create a new Tutor profile
        Tutor newTutor = new Tutor();
        newTutor.setName(request.getName());
        newTutor.setEmail(request.getEmail());
        newTutor.setPhoneNumber(request.getPhoneNumber());
        // Generate a unique tutorId, for example, using UUID
        newTutor.setTutorId(UUID.randomUUID().toString());
        tutorRepository.save(newTutor);

        return savedApplication;
    }

    public TutorApplication getApplicationByEmail(String email) {
        return tutorApplicationRepository.findByEmail(email)
                .orElse(null);
    }
}
