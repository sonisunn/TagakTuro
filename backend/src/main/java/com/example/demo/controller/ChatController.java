package com.example.demo.controller;

import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.MessageDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatService chatService;

    /**
     * Start a new conversation with another user
     * POST /api/chat/conversations/start
     */
    @PostMapping("/conversations/start")
    public ResponseEntity<?> startConversation(
            @RequestParam Long userId1,
            @RequestParam Long userId2) {
        try {
            ConversationDTO conversation = chatService.startConversation(userId1, userId2);
            return ResponseEntity.ok(conversation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get or create a conversation between two users
     * GET /api/chat/conversations/with/{userId}
     */
    @GetMapping("/conversations/with/{userId}")
    public ResponseEntity<?> getOrCreateConversation(
            @PathVariable Long userId,
            @RequestParam Long currentUserId) {
        try {
            ConversationDTO conversation = chatService.getOrCreateConversation(currentUserId, userId);
            return ResponseEntity.ok(conversation);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all conversations for a user (paginated)
     * GET /api/chat/conversations?userId=1&page=0&size=20
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getUserConversations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<ConversationDTO> conversations = chatService.getUserConversations(userId, page, size);
            return ResponseEntity.ok(conversations);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get a specific conversation
     * GET /api/chat/conversations/{conversationId}
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        try {
            ConversationDTO conversation = chatService.getConversation(conversationId, userId);
            return ResponseEntity.ok(conversation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Send a message (REST endpoint - real-time is handled via WebSocket)
     * POST /api/chat/messages
     */
    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(
            @RequestBody SendMessageRequest request,
            @RequestParam Long userId) {
        try {
            if (request.getContent() == null || request.getContent().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Message content cannot be empty"));
            }

            MessageDTO message = chatService.sendMessage(
                    request.getConversationId(), userId, request);
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get message history for a conversation (paginated)
     * GET /api/chat/messages/history/{conversationId}?userId=1&page=0&size=50
     */
    @GetMapping("/messages/history/{conversationId}")
    public ResponseEntity<?> getMessageHistory(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            Page<MessageDTO> messages = chatService.getMessageHistory(conversationId, userId, page, size);
            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark a message as read
     * POST /api/chat/messages/{messageId}/read
     */
    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(
            @PathVariable Long messageId,
            @RequestParam Long userId) {
        try {
            MessageDTO message = chatService.markMessageAsRead(messageId, userId);
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark all messages in a conversation as read
     * POST /api/chat/conversations/{conversationId}/read
     */
    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<?> markConversationAsRead(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        try {
            chatService.markConversationAsRead(conversationId, userId);
            return ResponseEntity.ok(Map.of("message", "All messages marked as read"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get unread message count for a conversation
     * GET /api/chat/conversations/{conversationId}/unread-count
     */
    @GetMapping("/conversations/{conversationId}/unread-count")
    public ResponseEntity<?> getUnreadMessageCount(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        try {
            Long unreadCount = chatService.getUnreadMessageCount(conversationId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("conversationId", conversationId);
            response.put("unreadCount", unreadCount);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Search conversations by user name or email
     * GET /api/chat/conversations/search?userId=1&q=john
     */
    @GetMapping("/conversations/search")
    public ResponseEntity<?> searchConversations(
            @RequestParam Long userId,
            @RequestParam String q) {
        try {
            if (q == null || q.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Search query cannot be empty"));
            }

            List<ConversationDTO> conversations = chatService.searchConversations(userId, q);
            return ResponseEntity.ok(conversations);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a conversation
     * DELETE /api/chat/conversations/{conversationId}
     */
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        try {
            chatService.deleteConversation(conversationId, userId);
            return ResponseEntity.ok(Map.of("message", "Conversation deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get total unread message count across all conversations for a user
     * GET /api/chat/total-unread-count?userId=1
     */
    @GetMapping("/total-unread-count")
    public ResponseEntity<?> getTotalUnreadCount(@RequestParam Long userId) {
        try {
            Page<ConversationDTO> conversations = chatService.getUserConversations(userId, 0, Integer.MAX_VALUE);
            long totalUnread = conversations.stream()
                    .mapToLong(conv -> conv.getUnreadCount() != null ? conv.getUnreadCount() : 0)
                    .sum();
            return ResponseEntity.ok(Map.of("userId", userId, "totalUnreadCount", totalUnread));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     * GET /api/chat/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Chat service is running", "timestamp", System.currentTimeMillis()));
    }
}
