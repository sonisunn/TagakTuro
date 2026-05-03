package com.example.demo.service;

import com.example.demo.dto.TutorApplicationRequest;
import com.example.demo.model.TutorApplication;
import com.example.demo.model.User;
import com.example.demo.model.Tutor;
import com.example.demo.service.NotificationService;
import com.example.demo.repository.TutorApplicationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.StudentRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TutorApplicationService {

    private final TutorApplicationRepository tutorApplicationRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public TutorApplicationService(TutorApplicationRepository tutorApplicationRepository,
            BCryptPasswordEncoder passwordEncoder,
            FileStorageService fileStorageService,
            UserRepository userRepository,
            TutorRepository tutorRepository,
            StudentRepository studentRepository,
            NotificationService notificationService,
            EmailService emailService) {
        this.tutorApplicationRepository = tutorApplicationRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.tutorRepository = tutorRepository;
        this.studentRepository = studentRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    public TutorApplication apply(TutorApplicationRequest request, MultipartFile reportOfGrades,
            MultipartFile certificates) {
        if (tutorApplicationRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already used for an application.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already registered as a user.");
        }
        if (tutorApplicationRepository.existsByStudentId(request.getStudentId())) {
            throw new IllegalStateException("Student ID is already used in an existing application.");
        }
        if (studentRepository.existsByStudentId(request.getStudentId())) {
            throw new IllegalStateException("Student ID is already registered.");
        }
        if (tutorRepository.existsByTutorId(request.getStudentId())) {
            throw new IllegalStateException("Student ID is already registered as a tutor.");
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

        TutorApplication saved = tutorApplicationRepository.save(application);

        try {
            emailService.sendApplicationSubmissionEmail(
                    request.getEmail(),
                    request.getName(),
                    request.getStudentId(),
                    request.getCourseProgram(),
                    request.getEmail(),
                    request.getPhoneNumber(),
                    request.getPassword()
            );
        } catch (Exception e) {
            System.err.println("Failed to send submission confirmation email: " + e.getMessage());
        }

        return saved;
    }

    public boolean isStudentIdTaken(String studentId) {
        return tutorApplicationRepository.existsByStudentId(studentId)
                || studentRepository.existsByStudentId(studentId)
                || tutorRepository.existsByTutorId(studentId);
    }

    public TutorApplication getApplicationByEmail(String email) {
        return tutorApplicationRepository.findByEmail(email)
                .orElse(null);
    }

    public TutorApplication getApplicationById(Long id) {
        return tutorApplicationRepository.findById(id)
                .orElse(null);
    }

    public List<TutorApplication> getAllApplications() {
        return tutorApplicationRepository.findAll();
    }

    private void createTutorAccounts(TutorApplication application) {
        // Check if user already exists (safety check)
        if (userRepository.findByEmail(application.getEmail()).isPresent()) {
            return;
        }

        // Create a new User for the tutor
        User newUser = new User();
        newUser.setName(application.getName());
        newUser.setStudentId(application.getStudentId());
        newUser.setCourseProgram(application.getCourseProgram());
        newUser.setEmail(application.getEmail());
        newUser.setPhoneNumber(application.getPhoneNumber());
        newUser.setPassword(application.getPassword()); // Already hashed in apply()
        newUser.setRoles(Collections.singleton("ROLE_TUTOR"));
        User savedUser = userRepository.save(newUser);

        // Create a new Tutor profile
        Tutor newTutor = new Tutor();
        newTutor.setName(application.getName());
        newTutor.setEmail(application.getEmail());
        newTutor.setPhoneNumber(application.getPhoneNumber());
        newTutor.setCourseProgram(application.getCourseProgram());
        // Use student ID as tutor ID
        newTutor.setTutorId(application.getStudentId());
        newTutor.setUser(savedUser);
        tutorRepository.save(newTutor);
    }

    public void acceptApplication(Long applicationId) {
        @SuppressWarnings("null")
        Optional<TutorApplication> applicationOpt = tutorApplicationRepository.findById(applicationId);
        if (applicationOpt.isPresent()) {
            TutorApplication application = applicationOpt.get();
            if ("APPROVED".equals(application.getStatus())) {
                return;
            }
            
            application.setStatus("APPROVED");
            tutorApplicationRepository.save(application);

            // Create User and Tutor accounts only now!
            createTutorAccounts(application);

            // Send Email Notification
            emailService.sendApplicationStatusEmail(application.getEmail(), application.getName(), "APPROVED");

            // Send notification to the applicant's User account
            try {
                Optional<User> userOpt = userRepository.findByEmail(application.getEmail());
                if (userOpt.isPresent()) {
                    notificationService.createNotification(
                            userOpt.get(),
                            "Application Approved!",
                            "Your tutor application has been approved. Welcome to TagakTuro!"
                    );
                }
            } catch (Exception e) {
                System.err.println("Failed to send approval notification: " + e.getMessage());
            }
        } else {
            throw new IllegalArgumentException("Application not found with id: " + applicationId);
        }
    }

    public void rejectApplication(Long applicationId) {
        @SuppressWarnings("null")
        Optional<TutorApplication> applicationOpt = tutorApplicationRepository.findById(applicationId);
        if (applicationOpt.isPresent()) {
            TutorApplication application = applicationOpt.get();
            application.setStatus("REJECTED");
            tutorApplicationRepository.save(application);

            // Send Email Notification
            emailService.sendApplicationStatusEmail(application.getEmail(), application.getName(), "REJECTED");

            // Send notification logic would fail here because there's no User account yet
            // But we can record the rejection status for future reference
        } else {
            throw new IllegalArgumentException("Application not found with id: " + applicationId);
        }
    }

    public void acceptAllApplications() {
        List<TutorApplication> applications = tutorApplicationRepository.findAll();
        for (TutorApplication application : applications) {
            if (!"APPROVED".equals(application.getStatus())) {
                application.setStatus("APPROVED");
                tutorApplicationRepository.save(application);
                
                // Create accounts for batch approval
                createTutorAccounts(application);

                // Send Email Notification
                emailService.sendApplicationStatusEmail(application.getEmail(), application.getName(), "APPROVED");

                try {
                    Optional<User> userOpt = userRepository.findByEmail(application.getEmail());
                    if (userOpt.isPresent()) {
                        notificationService.createNotification(
                                userOpt.get(),
                                "Application Approved!",
                                "Your tutor application has been approved. Welcome to TagakTuro!"
                        );
                    }
                } catch (Exception e) {
                    System.err.println("Failed to send approval notification for " + application.getEmail() + ": " + e.getMessage());
                }
            }
        }
    }
}
