package com.example.demo.controller;

import com.example.demo.dto.SendMessageRequest;
import com.example.demo.service.TutorStudentChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat/tutor-student")
@CrossOrigin(origins = "*")
public class TutorStudentChatController {

    @Autowired
    private TutorStudentChatService tutorStudentChatService;

    @PostMapping("/start")
    public ResponseEntity<?> startTutorStudentChat(
            @RequestParam Long studentId,
            @RequestParam Long tutorId) {
        try {
            Map<String, Object> response = tutorStudentChatService.startTutorStudentChat(studentId, tutorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/conversations")
    public ResponseEntity<?> getStudentConversations(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Map<String, Object> response = tutorStudentChatService.getStudentConversations(studentId, page, size);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tutor/{tutorId}/conversations")
    public ResponseEntity<?> getTutorConversations(
            @PathVariable Long tutorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Map<String, Object> response = tutorStudentChatService.getTutorConversations(tutorId, page, size);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/message")
    public ResponseEntity<?> sendTutorStudentMessage(
            @RequestParam Long studentId,
            @RequestParam Long tutorId,
            @RequestParam(required = false) String sender,
            @RequestBody SendMessageRequest request) {
        try {
            Map<String, Object> response = tutorStudentChatService.sendTutorStudentMessage(studentId, tutorId, sender, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(
            @RequestParam Long studentId,
            @RequestParam Long tutorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            Map<String, Object> response = tutorStudentChatService.getChatHistory(studentId, tutorId, page, size);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
