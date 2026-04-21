package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.model.Student;
import com.example.demo.service.AuthService;
import com.example.demo.service.UserService;
import com.example.demo.security.JwtUtil;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.SignupRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.model.Tutor;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

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

    // compatibility alias for older docs/scripts that use /register
    @PostMapping("/register")
    public ResponseEntity<?> registerUserAlias(@RequestBody SignupRequest signUpRequest) {
        return registerUser(signUpRequest);
    }

    // login endpoint (accepts JSON body: { "email": "..", "password": ".." })
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.loginUser(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "An unexpected error occurred"));
        }
    }
}
