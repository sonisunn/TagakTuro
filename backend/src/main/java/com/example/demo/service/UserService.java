package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
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

    // login user
    public User loginUser(String email, String password) {
        System.out.println(">>> ATTEMPTING LOGIN FOR EMAIL: " + email);
        System.out.println(">>> USERS IN DB: " + userRepository.findAll().stream().map(User::getEmail).toList());
        
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            System.out.println(">>> ERROR: User not found for email: " + email);
            throw new RuntimeException("User not found");
        }
        User existingUser = optionalUser.get();

        if (!passwordEncoder.matches(password, existingUser.getPassword())) {
            System.out.println(">>> ERROR: Password mismatch for email: " + email);
            throw new RuntimeException("Invalid credentials");
        }

        return existingUser;
    }
}
