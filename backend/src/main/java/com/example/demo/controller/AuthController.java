package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import com.example.demo.security.JwtUtil;

// DTOs
import com.example.demo.controller.LoginRequest;
import com.example.demo.controller.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow frontend to access backend (for now)
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // register endpoint
    @PostMapping("/register")
    public org.springframework.http.ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User saved = userService.registerUser(user);
            return org.springframework.http.ResponseEntity.ok(saved);
        } catch (Exception e) {
            // return error message in response body to help debug client/server issues
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // login endpoint (accepts JSON body: { "email": "..", "password": ".." })
    @PostMapping("/login")
    public LoginResponse loginUser(@RequestBody LoginRequest request) {
        User user = userService.loginUser(request.getEmail(), request.getPassword());
        // generate token
        String token = jwtUtil.generateToken(user.getEmail());
        return new LoginResponse(token, user);
    }
}
