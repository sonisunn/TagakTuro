package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.model.Student;
import com.example.demo.service.AuthService;
import com.example.demo.service.UserService;
import com.example.demo.security.JwtUtil;
import com.example.demo.repository.StudentRepository; // Import StudentRepository
import com.example.demo.repository.TutorRepository;

// DTOs
import com.example.demo.controller.LoginRequest;
import com.example.demo.controller.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.model.Tutor;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private StudentRepository studentRepository; // Inject StudentRepository

    @Autowired
    private TutorRepository tutorRepository;

    // signup endpoint
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.ok(java.util.Map.of("message", "User registered successfully!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // login endpoint (accepts JSON body: { "email": "..", "password": ".." })
    @PostMapping("/login")
    public LoginResponse loginUser(@RequestBody LoginRequest request) {
        User user = userService.loginUser(request.getEmail(), request.getPassword());
        // generate token
        String token = jwtUtil.generateToken(user.getEmail());

        Long studentId = null;
        Long tutorId = null;

        if (user.getRoles() != null && user.getRoles().contains("STUDENT")) {
            studentId = studentRepository.findByEmail(user.getEmail())
                    .map(Student::getId)
                    .orElse(null);
        }

        if (user.getRoles() != null && user.getRoles().contains("TUTOR")) {
            tutorId = tutorRepository.findByEmail(user.getEmail())
                    .map(Tutor::getId)
                    .orElse(null);
        }

        return new LoginResponse(token, user, studentId, tutorId);
    }
}
