package com.example.demo.service;

import com.example.demo.model.Tutor;
import com.example.demo.repository.TutorRepository;
import com.example.demo.model.User;
import com.example.demo.model.Student;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.controller.SignupRequest; // Added import
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
            Student newStudent = new Student();
            newStudent.setName(signupRequest.getName());
            newStudent.setEmail(signupRequest.getEmail());
            newStudent.setStudentId(signupRequest.getStudentId());
            newStudent.setCourseProgram(signupRequest.getCourseProgram());
            newStudent.setPhoneNumber(signupRequest.getPhoneNumber());
            Student savedStudent = studentRepository.save(newStudent);
        } else { // TUTOR
            if (tutorRepository.existsByTutorId(signupRequest.getStudentId())) { // Assuming studentId is used for tutorId
                throw new IllegalArgumentException("Error: Tutor ID is already in use!");
            }
            roles.add("ROLE_TUTOR");
            Tutor newTutor = new Tutor();
            newTutor.setName(signupRequest.getName());
            newTutor.setEmail(signupRequest.getEmail());
            newTutor.setTutorId(signupRequest.getStudentId()); // Use studentId as tutorId
            newTutor.setPhoneNumber(signupRequest.getPhoneNumber());
            tutorRepository.save(newTutor);
        }

        newUser.setRoles(roles);
        return userRepository.save(newUser);
    }
}