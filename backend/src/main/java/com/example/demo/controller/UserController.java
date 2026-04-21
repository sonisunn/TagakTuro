package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    // Update user profile (partial updates allowed)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User incoming) {
        User updatedUser = userService.updateUser(id, incoming);
        if (updatedUser == null) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(updatedUser);
    }
}
