package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

@Service
@SuppressWarnings("all")
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // register user
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        // encrypt password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // save user
        return userRepository.save(user);
    }

    @Autowired
    private com.example.demo.repository.TutorApplicationRepository tutorApplicationRepository;

    // login user
    public User loginUser(String email, String password) {
        java.util.Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            // If user not found, check if they are a pending or rejected tutor applicant
            java.util.Optional<com.example.demo.model.TutorApplication> applicationOpt = tutorApplicationRepository.findByEmail(email);
            if (applicationOpt.isPresent()) {
                String status = applicationOpt.get().getStatus();
                if ("PENDING".equals(status)) {
                    throw new IllegalArgumentException("Your tutor application is still PENDING review. Please wait for an administrator to approve your account.");
                } else if ("REJECTED".equals(status)) {
                    throw new IllegalArgumentException("Your tutor application has been REJECTED. Please check your email for details.");
                }
            }
            throw new IllegalArgumentException("User not found with email: " + email);
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        return user;
    }

    public User updateUser(Long id, User incoming) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return null;
        }

        if (incoming.getName() != null) user.setName(incoming.getName());
        if (incoming.getEmail() != null) user.setEmail(incoming.getEmail());
        if (incoming.getPhoneNumber() != null) user.setPhoneNumber(incoming.getPhoneNumber());
        if (incoming.getCourseProgram() != null) user.setCourseProgram(incoming.getCourseProgram());

        return userRepository.save(user);
    }
}
