package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.Student;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.controller.SignupRequest; // Added import
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional // Ensures both operations succeed or both fail together
    public User registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new IllegalArgumentException("Error: Email is already in use!");
        }
        if (studentRepository.existsByStudentId(signupRequest.getStudentId())) {
            throw new IllegalArgumentException("Error: Student ID is already in use!");
        }

        // 1. Create and save the user for authentication
        User newUser = new User();
        newUser.setId(null); // Ensure ID is null for new entity
        newUser.setName(signupRequest.getName());
        newUser.setEmail(signupRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        
        java.util.Set<String> roles = new java.util.HashSet<>();
        roles.add("ROLE_STUDENT");
        newUser.setRoles(roles);
        
        User savedUser = userRepository.save(newUser);

        // 2. Create and save the corresponding student profile
        Student newStudent = new Student();
        newStudent.setName(signupRequest.getName());
        newStudent.setEmail(signupRequest.getEmail());
        newStudent.setStudentId(signupRequest.getStudentId());
        newStudent.setCourseProgram(signupRequest.getCourseProgram());
        newStudent.setPhoneNumber(signupRequest.getPhoneNumber());
        studentRepository.save(newStudent);

        return savedUser;
    }
}