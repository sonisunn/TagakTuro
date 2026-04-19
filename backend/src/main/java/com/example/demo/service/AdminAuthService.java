package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AdminAuthService {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_CCED = "ROLE_CCED";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User loginAdminWebUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        Set<String> roles = user.getRoles();
        boolean hasAdminWebRole = roles != null
                && (roles.contains(ROLE_ADMIN) || roles.contains(ROLE_CCED));

        if (!hasAdminWebRole) {
            throw new RuntimeException("Access denied. Admin-web account required.");
        }

        return user;
    }

    public String resolvePortal(Set<String> roles) {
        if (roles != null && roles.contains(ROLE_CCED)) {
            return "CCED";
        }
        return "ADMIN";
    }
}
