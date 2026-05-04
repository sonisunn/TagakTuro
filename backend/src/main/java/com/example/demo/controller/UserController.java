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

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        User user = userService.getUser(id);
        if (user == null) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User incoming) {
        User updatedUser = userService.updateUser(id, incoming);
        if (updatedUser == null) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/{id}/photo")
    public ResponseEntity<?> updateProfilePhoto(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        User updated = userService.updateProfilePhoto(id, body.get("imageBase64"));
        if (updated == null) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(updated);
    }
}
