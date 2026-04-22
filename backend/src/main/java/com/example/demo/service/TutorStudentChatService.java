package com.example.demo.service;

import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.MessageDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.model.Student;
import com.example.demo.model.Tutor;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TutorStudentChatService {

    @Autowired
    private ChatService chatService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    public Map<String, Object> startTutorStudentChat(Long studentId, Long tutorId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

        if (student.getUser() == null) {
            throw new IllegalArgumentException("Student does not have a user account");
        }
        if (tutor.getUser() == null) {
            throw new IllegalArgumentException("Tutor does not have a user account");
        }

        ConversationDTO conversation = chatService.startConversation(
                student.getUser().getId(),
                tutor.getUser().getId());

        Map<String, Object> response = new HashMap<>();
        response.put("conversation", conversation);
        response.put("student", Map.of(
                "id", student.getId(),
                "name", student.getName(),
                "studentId", student.getStudentId(),
                "userId", student.getUser().getId()));
        response.put("tutor", Map.of(
                "id", tutor.getId(),
                "name", tutor.getName(),
                "tutorId", tutor.getTutorId(),
                "userId", tutor.getUser().getId()));

        return response;
    }

    public Map<String, Object> getStudentConversations(Long studentId, int page, int size) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        if (student.getUser() == null) {
            throw new IllegalArgumentException("Student does not have a user account");
        }

        Long studentUserId = student.getUser().getId();
        Page<ConversationDTO> conversations = chatService.getUserConversations(
                studentUserId, page, size);

        List<Map<String, Object>> enrichedConversations = conversations.getContent().stream()
                .map(conv -> enrichConversationWithTutorInfo(conv, studentUserId))
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("student", Map.of("id", student.getId(), "name", student.getName()));
        response.put("conversations", enrichedConversations);
        response.put("totalElements", conversations.getTotalElements());
        response.put("totalPages", conversations.getTotalPages());
        response.put("currentPage", conversations.getNumber());

        return response;
    }

    public Map<String, Object> getTutorConversations(Long tutorId, int page, int size) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

        if (tutor.getUser() == null) {
            throw new IllegalArgumentException("Tutor does not have a user account");
        }

        Long tutorUserId = tutor.getUser().getId();
        Page<ConversationDTO> conversations = chatService.getUserConversations(
                tutorUserId, page, size);

        List<Map<String, Object>> enrichedConversations = conversations.getContent().stream()
                .map(conv -> enrichConversationWithStudentInfo(conv, tutorUserId))
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("tutor", Map.of("id", tutor.getId(), "name", tutor.getName()));
        response.put("conversations", enrichedConversations);
        response.put("totalElements", conversations.getTotalElements());
        response.put("totalPages", conversations.getTotalPages());
        response.put("currentPage", conversations.getNumber());

        return response;
    }

    public Map<String, Object> sendTutorStudentMessage(Long studentId, Long tutorId, String sender, SendMessageRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

        if (student.getUser() == null || tutor.getUser() == null) {
            throw new IllegalArgumentException("Student or Tutor does not have a user account");
        }

        Long senderUserId;
        String senderRole;
        if ("STUDENT".equalsIgnoreCase(sender)) {
            senderUserId = student.getUser().getId();
            senderRole = "STUDENT";
        } else if ("TUTOR".equalsIgnoreCase(sender)) {
            senderUserId = tutor.getUser().getId();
            senderRole = "TUTOR";
        } else {
            throw new IllegalArgumentException("Sender must be 'STUDENT' or 'TUTOR'");
        }

        ConversationDTO conversation = chatService.getOrCreateConversation(
                student.getUser().getId(),
                tutor.getUser().getId());

        MessageDTO message = chatService.sendMessage(
                conversation.getId(),
                senderUserId,
                request);

        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("senderRole", senderRole);
        response.put("conversationId", conversation.getId());

        return response;
    }

    public Map<String, Object> getChatHistory(Long studentId, Long tutorId, int page, int size) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Tutor not found: " + tutorId));

        if (student.getUser() == null || tutor.getUser() == null) {
            throw new IllegalArgumentException("Student or Tutor does not have a user account");
        }

        ConversationDTO conversation = chatService.getOrCreateConversation(
                student.getUser().getId(),
                tutor.getUser().getId());

        Page<MessageDTO> messages = chatService.getMessageHistory(
                conversation.getId(),
                student.getUser().getId(),
                page,
                size);

        Map<String, Object> response = new HashMap<>();
        response.put("student", Map.of("id", student.getId(), "name", student.getName()));
        response.put("tutor", Map.of("id", tutor.getId(), "name", tutor.getName()));
        response.put("conversationId", conversation.getId());
        response.put("messages", messages);

        return response;
    }

    private Map<String, Object> enrichConversationWithTutorInfo(ConversationDTO conv, Long currentUserId) {
        Map<String, Object> enriched = new HashMap<>();
        enriched.put("conversationId", conv.getId());
        enriched.put("lastMessage", conv.getLastMessage());
        enriched.put("unreadCount", conv.getUnreadCount());
        enriched.put("createdAt", conv.getCreatedAt());
        enriched.put("updatedAt", conv.getUpdatedAt());

        Long otherUserId = conv.getUser1Id().equals(currentUserId) ? conv.getUser2Id() : conv.getUser1Id();
        Tutor tutor = tutorRepository.findByUser_Id(otherUserId).orElse(null);

        if (tutor != null) {
            enriched.put("tutor", Map.of(
                    "id", tutor.getId(),
                    "name", tutor.getName(),
                    "tutorId", tutor.getTutorId(),
                    "email", tutor.getEmail()));
        }

        return enriched;
    }

    private Map<String, Object> enrichConversationWithStudentInfo(ConversationDTO conv, Long currentUserId) {
        Map<String, Object> enriched = new HashMap<>();
        enriched.put("conversationId", conv.getId());
        enriched.put("lastMessage", conv.getLastMessage());
        enriched.put("unreadCount", conv.getUnreadCount());
        enriched.put("createdAt", conv.getCreatedAt());
        enriched.put("updatedAt", conv.getUpdatedAt());

        Long otherUserId = conv.getUser1Id().equals(currentUserId) ? conv.getUser2Id() : conv.getUser1Id();
        Student student = studentRepository.findByUser_Id(otherUserId).orElse(null);

        if (student != null) {
            enriched.put("student", Map.of(
                    "id", student.getId(),
                    "name", student.getName(),
                    "studentId", student.getStudentId(),
                    "email", student.getEmail()));
        }

        return enriched;
    }
}
