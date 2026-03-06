package com.example.demo.controller;

import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.MessageDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.dto.TutorStudentChatRequest;
import com.example.demo.model.Student;
import com.example.demo.model.Tutor;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat/tutor-student")
@CrossOrigin(origins = "*")
public class TutorStudentChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    /**
     * Start a chat between a tutor and a student using their IDs
     * POST /api/chat/tutor-student/start?studentId=1&tutorId=2
     */
    @PostMapping("/start")
    public ResponseEntity<?> startTutorStudentChat(
            @RequestParam Long studentId,
            @RequestParam Long tutorId) {
        try {
            // Get student and tutor
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
            
            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

            // Check if both have user accounts
            if (student.getUser() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Student does not have a user account"));
            }
            if (tutor.getUser() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Tutor does not have a user account"));
            }

            // Start conversation using user IDs
            ConversationDTO conversation = chatService.startConversation(
                    student.getUser().getId(), 
                    tutor.getUser().getId()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("conversation", conversation);
            response.put("student", Map.of(
                "id", student.getId(),
                "name", student.getName(),
                "studentId", student.getStudentId(),
                "userId", student.getUser().getId()
            ));
            response.put("tutor", Map.of(
                "id", tutor.getId(),
                "name", tutor.getName(),
                "tutorId", tutor.getTutorId(),
                "userId", tutor.getUser().getId()
            ));

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get conversations for a student (all tutors they're chatting with)
     * GET /api/chat/tutor-student/student/{studentId}/conversations
     */
    @GetMapping("/student/{studentId}/conversations")
    public ResponseEntity<?> getStudentConversations(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

            if (student.getUser() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Student does not have a user account"));
            }

            Page<ConversationDTO> conversations = chatService.getUserConversations(
                    student.getUser().getId(), page, size);

            // Enrich with tutor information
            List<Map<String, Object>> enrichedConversations = conversations.getContent().stream()
                    .map(conv -> enrichConversationWithTutorInfo(conv, student.getId()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("student", Map.of("id", student.getId(), "name", student.getName()));
            response.put("conversations", enrichedConversations);
            response.put("totalElements", conversations.getTotalElements());
            response.put("totalPages", conversations.getTotalPages());
            response.put("currentPage", conversations.getNumber());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get conversations for a tutor (all students they're chatting with)
     * GET /api/chat/tutor-student/tutor/{tutorId}/conversations
     */
    @GetMapping("/tutor/{tutorId}/conversations")
    public ResponseEntity<?> getTutorConversations(
            @PathVariable Long tutorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

            if (tutor.getUser() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Tutor does not have a user account"));
            }

            Page<ConversationDTO> conversations = chatService.getUserConversations(
                    tutor.getUser().getId(), page, size);

            // Enrich with student information
            List<Map<String, Object>> enrichedConversations = conversations.getContent().stream()
                    .map(conv -> enrichConversationWithStudentInfo(conv, tutor.getId()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("tutor", Map.of("id", tutor.getId(), "name", tutor.getName()));
            response.put("conversations", enrichedConversations);
            response.put("totalElements", conversations.getTotalElements());
            response.put("totalPages", conversations.getTotalPages());
            response.put("currentPage", conversations.getNumber());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Send a message in tutor-student chat
     * POST /api/chat/tutor-student/message?studentId=1&tutorId=2
     */
    @PostMapping("/message")
    public ResponseEntity<?> sendTutorStudentMessage(
            @RequestParam Long studentId,
            @RequestParam Long tutorId,
            @RequestParam(required = false) String sender, // "STUDENT" or "TUTOR"
            @RequestBody SendMessageRequest request) {
        try {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
            
            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

            if (student.getUser() == null || tutor.getUser() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Student or Tutor does not have a user account"));
            }

            // Determine sender
            Long senderUserId;
            String senderRole;
            if ("STUDENT".equalsIgnoreCase(sender)) {
                senderUserId = student.getUser().getId();
                senderRole = "STUDENT";
            } else if ("TUTOR".equalsIgnoreCase(sender)) {
                senderUserId = tutor.getUser().getId();
                senderRole = "TUTOR";
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Sender must be 'STUDENT' or 'TUTOR'"));
            }

            // Get or create conversation
            ConversationDTO conversation = chatService.getOrCreateConversation(
                    student.getUser().getId(), 
                    tutor.getUser().getId()
            );

            // Send the message
            MessageDTO message = chatService.sendMessage(
                    conversation.getId(), 
                    senderUserId, 
                    request
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", message);
            response.put("senderRole", senderRole);
            response.put("conversationId", conversation.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get message history between a student and tutor
     * GET /api/chat/tutor-student/history?studentId=1&tutorId=2&page=0&size=50
     */
    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(
            @RequestParam Long studentId,
            @RequestParam Long tutorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
            
            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

            if (student.getUser() == null || tutor.getUser() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Student or Tutor does not have a user account"));
            }

            ConversationDTO conversation = chatService.getOrCreateConversation(
                    student.getUser().getId(), 
                    tutor.getUser().getId()
            );

            Page<MessageDTO> messages = chatService.getMessageHistory(
                    conversation.getId(), 
                    student.getUser().getId(), 
                    page, 
                    size
            );

            Map<String, Object> response = new HashMap<>();
            response.put("student", Map.of("id", student.getId(), "name", student.getName()));
            response.put("tutor", Map.of("id", tutor.getId(), "name", tutor.getName()));
            response.put("conversationId", conversation.getId());
            response.put("messages", messages);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Helper methods

    private Map<String, Object> enrichConversationWithTutorInfo(ConversationDTO conv, Long studentId) {
        Map<String, Object> enriched = new HashMap<>();
        enriched.put("conversationId", conv.getId());
        enriched.put("lastMessage", conv.getLastMessage());
        enriched.put("unreadCount", conv.getUnreadCount());
        enriched.put("createdAt", conv.getCreatedAt());
        enriched.put("updatedAt", conv.getUpdatedAt());

        // Find the tutor
        Long otherUserId = conv.getUser1Id().equals(conv.getId()) ? conv.getUser2Id() : conv.getUser1Id();
        Tutor tutor = tutorRepository.findByUserId(otherUserId).orElse(null);
        
        if (tutor != null) {
            enriched.put("tutor", Map.of(
                "id", tutor.getId(),
                "name", tutor.getName(),
                "tutorId", tutor.getTutorId(),
                "email", tutor.getEmail()
            ));
        }

        return enriched;
    }

    private Map<String, Object> enrichConversationWithStudentInfo(ConversationDTO conv, Long tutorId) {
        Map<String, Object> enriched = new HashMap<>();
        enriched.put("conversationId", conv.getId());
        enriched.put("lastMessage", conv.getLastMessage());
        enriched.put("unreadCount", conv.getUnreadCount());
        enriched.put("createdAt", conv.getCreatedAt());
        enriched.put("updatedAt", conv.getUpdatedAt());

        // Find the student
        Long otherUserId = conv.getUser1Id().equals(conv.getId()) ? conv.getUser2Id() : conv.getUser1Id();
        Student student = studentRepository.findByUserId(otherUserId).orElse(null);
        
        if (student != null) {
            enriched.put("student", Map.of(
                "id", student.getId(),
                "name", student.getName(),
                "studentId", student.getStudentId(),
                "email", student.getEmail()
            ));
        }

        return enriched;
    }
}
