package com.example.demo.controller;

import com.example.demo.dto.MessageDTO;
import com.example.demo.service.AutomatedMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/messages/automated")
@CrossOrigin(origins = "*")
public class AutomatedMessageController {

    @Autowired
    private AutomatedMessageService automatedMessageService;

    /**
     * Send automated tutor greeting when student is matched with tutor
     * POST /api/messages/automated/tutor-greeting/{bookingId}
     */
    @PostMapping("/tutor-greeting/{bookingId}")
    public ResponseEntity<?> sendTutorGreeting(@PathVariable Long bookingId) {
        try {
            MessageDTO greetingMessage = automatedMessageService.sendTutorGreetingMessage(bookingId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Tutor greeting sent successfully");
            response.put("messageData", greetingMessage);
            response.put("bookingId", bookingId);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send greeting: " + e.getMessage()));
        }
    }

    /**
     * Send diagnostic test instruction message
     * POST /api/messages/automated/diagnostic-test/{bookingId}
     */
    @PostMapping("/diagnostic-test/{bookingId}")
    public ResponseEntity<?> sendDiagnosticTest(@PathVariable Long bookingId) {
        try {
            MessageDTO diagnosticMessage = automatedMessageService.sendDiagnosticTestMessage(bookingId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Diagnostic test instruction sent");
            response.put("messageData", diagnosticMessage);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send diagnostic test: " + e.getMessage()));
        }
    }

    /**
     * Send study readiness message from tutor
     * POST
     * /api/messages/automated/study-readiness?conversationId=1&tutorUserId=2&subject=Math
     */
    @PostMapping("/study-readiness")
    public ResponseEntity<?> sendStudyReadiness(
            @RequestParam Long conversationId,
            @RequestParam Long tutorUserId,
            @RequestParam String subject) {
        try {
            MessageDTO readinessMessage = automatedMessageService.sendStudyReadinessMessage(
                    conversationId, tutorUserId, subject);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Study readiness message sent");
            response.put("messageData", readinessMessage);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send study readiness message: " + e.getMessage()));
        }
    }

    /**
     * Send custom automated message
     * POST /api/messages/automated/custom?conversationId=1&senderUserId=2
     * Body: { "content": "Your custom message here" }
     */
    @PostMapping("/custom")
    public ResponseEntity<?> sendCustomMessage(
            @RequestParam Long conversationId,
            @RequestParam Long senderUserId,
            @RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            if (content == null || content.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Message content is required"));
            }

            MessageDTO customMessage = automatedMessageService.sendSystemMessage(
                    conversationId, senderUserId, content);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "System message sent");
            response.put("messageData", customMessage);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send custom message: " + e.getMessage()));
        }
    }

    /**
     * Health check for automated message service
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity
                .ok(Map.of("status", "Automated message service is running", "timestamp", System.currentTimeMillis()));
    }
}
