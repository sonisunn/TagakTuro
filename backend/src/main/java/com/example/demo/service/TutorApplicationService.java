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
        // Step 1: Resolve the existing User (if any) and decide if this is a switch.
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        boolean isSwitchingFromStudent = false;
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            boolean isStudent = user.getRoles() != null && user.getRoles().contains("ROLE_STUDENT");
            if (!isStudent) {
                throw new IllegalStateException("Email already registered as a user.");
            }
            isSwitchingFromStudent = true;
        }

        // Step 2: Handle prior applications. A switching student is allowed to
        // re-submit (their old application gets replaced). Anyone else is blocked.
        Optional<TutorApplication> existingAppByEmail = tutorApplicationRepository.findByEmail(request.getEmail());
        if (existingAppByEmail.isPresent()) {
            if (!isSwitchingFromStudent) {
                throw new IllegalStateException("Email already used for an application.");
            }
            tutorApplicationRepository.delete(existingAppByEmail.get());
        }

        // Step 3: Now check student-ID uniqueness against OTHER applications.
        // Our own prior application (if any) was just deleted above, so any
        // remaining match means a different person has this student ID.
        if (tutorApplicationRepository.existsByStudentId(request.getStudentId())) {
            throw new IllegalStateException("Student ID is already used in an existing application.");
        }
        if (tutorRepository.existsByTutorId(request.getStudentId())) {
            throw new IllegalStateException("Student ID is already registered as a tutor.");
        }
        // For a switch, allow the same student ID; block only if it belongs to someone else.
        // We treat it as the "same student" if the existing student record matches via
        // ANY of these (some legacy student rows have null/inconsistent email columns,
        // so the User FK is the source of truth):
        //   - the student's user FK points to the same User as the email lookup
        //   - the student's email column matches the request email (case/whitespace-insensitive)
        //   - the student's User entity email matches the request email
        if (studentRepository.existsByStudentId(request.getStudentId())) {
            final String reqEmail = request.getEmail() == null ? "" : request.getEmail().trim();
            final Long existingUserId = existingUser.map(User::getId).orElse(null);
            boolean sameStudent = studentRepository.findByStudentId(request.getStudentId())
                    .map(s -> {
                        if (existingUserId != null && s.getUser() != null
                                && existingUserId.equals(s.getUser().getId())) {
                            return true;
                        }
                        if (s.getEmail() != null && s.getEmail().trim().equalsIgnoreCase(reqEmail)) {
                            return true;
                        }
                        if (s.getUser() != null && s.getUser().getEmail() != null
                                && s.getUser().getEmail().trim().equalsIgnoreCase(reqEmail)) {
                            return true;
                        }
                        return false;
                    })
                    .orElse(false);
            if (!sameStudent) {
                throw new IllegalStateException("Student ID is already registered.");
            }
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

    public boolean isEmailRegisteredAsStudent(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getRoles() != null && u.getRoles().contains("ROLE_STUDENT"))
                .orElse(false);
    }

    public boolean isStudentIdTaken(String studentId) {
        return tutorApplicationRepository.existsByStudentId(studentId)
                || studentRepository.existsByStudentId(studentId)
                || tutorRepository.existsByTutorId(studentId);
    }

    // Returns { taken, canSwitch } so the frontend knows whether to hard-block
    // or show the "switch to tutor?" prompt.
    //
    // canSwitch=true means "this student ID is taken, but the request is from
    // the same person — allow them to re-apply or switch from student → tutor".
    // It's true when EITHER:
    //   - The existing tutor application has the same email (re-applying), or
    //   - The existing student record belongs to the same person (matched via
    //     User FK, student.email, or user.email)
    // Tutors (existsByTutorId) are always a hard block — they've already
    // completed the switch and shouldn't be re-applying via this flow.
    public java.util.Map<String, Object> checkStudentIdStatus(String studentId, String email) {
        if (tutorRepository.existsByTutorId(studentId)) {
            return java.util.Map.of("taken", true, "canSwitch", false);
        }

        final String trimmedEmail = email == null ? "" : email.trim();
        boolean appExistsForId = tutorApplicationRepository.existsByStudentId(studentId);
        boolean studentExistsForId = studentRepository.existsByStudentId(studentId);

        if (!appExistsForId && !studentExistsForId) {
            return java.util.Map.of("taken", false, "canSwitch", false);
        }

        // Existing application: same applicant if email matches AND the application
        // has the same student ID we're checking.
        boolean sameApplicant = false;
        if (appExistsForId && !trimmedEmail.isEmpty()) {
            sameApplicant = tutorApplicationRepository.findByEmail(trimmedEmail)
                    .map(a -> studentId.equals(a.getStudentId()))
                    .orElse(false);
        }

        // Existing student record: same student via any of the three signals.
        boolean sameStudent = false;
        if (studentExistsForId && !trimmedEmail.isEmpty()) {
            final Long userIdForEmail = userRepository.findByEmail(trimmedEmail)
                    .map(User::getId).orElse(null);
            sameStudent = studentRepository.findByStudentId(studentId)
                    .map(s -> {
                        if (userIdForEmail != null && s.getUser() != null
                                && userIdForEmail.equals(s.getUser().getId())) {
                            return true;
                        }
                        if (s.getEmail() != null && s.getEmail().trim().equalsIgnoreCase(trimmedEmail)) {
                            return true;
                        }
                        if (s.getUser() != null && s.getUser().getEmail() != null
                                && s.getUser().getEmail().trim().equalsIgnoreCase(trimmedEmail)) {
                            return true;
                        }
                        return false;
                    })
                    .orElse(false);
        }

        return java.util.Map.of("taken", true, "canSwitch", sameApplicant || sameStudent);
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
        Optional<User> existingUserOpt = userRepository.findByEmail(application.getEmail());
        User savedUser;

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            boolean isStudent = existingUser.getRoles() != null && existingUser.getRoles().contains("ROLE_STUDENT");
            if (!isStudent) {
                // Already a tutor or admin — skip
                return;
            }
            // Upgrade student → tutor
            studentRepository.findByUser_Id(existingUser.getId()).ifPresent(studentRepository::delete);
            existingUser.getRoles().clear();
            existingUser.getRoles().add("ROLE_TUTOR");
            existingUser.setPassword(application.getPassword());
            existingUser.setStudentId(application.getStudentId());
            existingUser.setCourseProgram(application.getCourseProgram());
            savedUser = userRepository.save(existingUser);
        } else {
            // Create a new User for the tutor
            User newUser = new User();
            newUser.setName(application.getName());
            newUser.setStudentId(application.getStudentId());
            newUser.setCourseProgram(application.getCourseProgram());
            newUser.setEmail(application.getEmail());
            newUser.setPhoneNumber(application.getPhoneNumber());
            newUser.setPassword(application.getPassword());
            newUser.setRoles(Collections.singleton("ROLE_TUTOR"));
            savedUser = userRepository.save(newUser);
        }

        // Create Tutor profile
        Tutor newTutor = new Tutor();
        newTutor.setName(application.getName());
        newTutor.setEmail(application.getEmail());
        newTutor.setPhoneNumber(application.getPhoneNumber());
        newTutor.setCourseProgram(application.getCourseProgram());
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

            try {
                emailService.sendApplicationStatusEmail(application.getEmail(), application.getName(), "APPROVED");
            } catch (Exception e) {
                System.err.println("Failed to send approval email: " + e.getMessage());
            }

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

            try {
                emailService.sendApplicationStatusEmail(application.getEmail(), application.getName(), "REJECTED");
            } catch (Exception e) {
                System.err.println("Failed to send rejection email: " + e.getMessage());
            }

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

                try {
                    emailService.sendApplicationStatusEmail(application.getEmail(), application.getName(), "APPROVED");
                } catch (Exception e) {
                    System.err.println("Failed to send approval email for " + application.getEmail() + ": " + e.getMessage());
                }

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
