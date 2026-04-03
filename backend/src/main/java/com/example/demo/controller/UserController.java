package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Update user profile (partial updates allowed)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User incoming) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "User not found"));
        }

        if (incoming.getName() != null) user.setName(incoming.getName());
        if (incoming.getEmail() != null) user.setEmail(incoming.getEmail());
        if (incoming.getPhoneNumber() != null) user.setPhoneNumber(incoming.getPhoneNumber());
        if (incoming.getCourseProgram() != null) user.setCourseProgram(incoming.getCourseProgram());

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
}
