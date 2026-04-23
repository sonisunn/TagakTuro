package com.example.demo.service;

import com.example.demo.model.Tutor;
import com.example.demo.repository.TutorRepository;
import com.example.demo.model.User;
import com.example.demo.model.Student;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.dto.SignupRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(SignupRequest signupRequest) {
        // Validate email domain - only @umak.edu.ph emails are allowed
        if (signupRequest.getEmail() == null || !signupRequest.getEmail().endsWith("@umak.edu.ph")) {
            throw new IllegalArgumentException("Error: Only @umak.edu.ph email addresses are allowed!");
        }

        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new IllegalArgumentException("Error: Email is already in use!");
        }

        String role = signupRequest.getRole();
        if (role == null || (!role.equals("STUDENT") && !role.equals("TUTOR"))) {
            throw new IllegalArgumentException("Error: Invalid role specified!");
        }

        User newUser = new User();
        newUser.setName(signupRequest.getName());
        newUser.setEmail(signupRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        newUser.setStudentId(signupRequest.getStudentId());
        newUser.setCourseProgram(signupRequest.getCourseProgram());

        Set<String> roles = new HashSet<>();
        if (role.equals("STUDENT")) {
            if (studentRepository.existsByStudentId(signupRequest.getStudentId())) {
                throw new IllegalArgumentException("Error: Student ID is already in use!");
            }
            roles.add("ROLE_STUDENT");
            newUser.setRoles(roles);
            // Save User first so it gets an ID
            User savedUser = userRepository.save(newUser);

            Student newStudent = new Student();
            newStudent.setName(signupRequest.getName());
            newStudent.setEmail(signupRequest.getEmail());
            newStudent.setStudentId(signupRequest.getStudentId());
            newStudent.setCourseProgram(signupRequest.getCourseProgram());
            newStudent.setPhoneNumber(signupRequest.getPhoneNumber());
            newStudent.setUser(savedUser); // Link Student to User
            studentRepository.save(newStudent);

            return savedUser;
        } else { // TUTOR
            if (tutorRepository.existsByTutorId(signupRequest.getStudentId())) { // Assuming studentId is used for tutorId
                throw new IllegalArgumentException("Error: Tutor ID is already in use!");
            }
            roles.add("ROLE_TUTOR");
            newUser.setRoles(roles);
            // Save User first so it gets an ID
            User savedUser = userRepository.save(newUser);

            Tutor newTutor = new Tutor();
            newTutor.setName(signupRequest.getName());
            newTutor.setEmail(signupRequest.getEmail());
            newTutor.setTutorId(signupRequest.getStudentId()); // Use studentId as tutorId
            newTutor.setPhoneNumber(signupRequest.getPhoneNumber());
            newTutor.setUser(savedUser); // Link Tutor to User
            tutorRepository.save(newTutor);

            return savedUser;
        }
    }

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponse loginUser(LoginRequest request) {
        User user = userService.loginUser(request.getEmail(), request.getPassword());
        
        // generate token
        String token = jwtUtil.generateToken(user.getEmail());

        Long studentId = null;
        Long tutorId = null;

        if (user.getRoles() != null && (user.getRoles().contains("ROLE_STUDENT") || user.getRoles().contains("STUDENT"))) {
            studentId = studentRepository.findByEmail(user.getEmail())
                    .map(Student::getId)
                    .orElse(null);
        }

        if (user.getRoles() != null && (user.getRoles().contains("ROLE_TUTOR") || user.getRoles().contains("TUTOR"))) {
            tutorId = tutorRepository.findByEmail(user.getEmail())
                    .map(Tutor::getId)
                    .orElse(null);
        }

        return new LoginResponse(token, user, studentId, tutorId, user.getRoles());
    }
}