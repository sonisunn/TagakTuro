package com.example.demo.controller;

import com.example.demo.config.WebSocketChannelInterceptor.UserPrincipal;
import com.example.demo.dto.MessageDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWebSocketController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handle incoming messages from a conversation
     * Client sends to: /app/chat/{conversationId}
     * Broadcasted to: /topic/conversation/{conversationId}
     */
    @MessageMapping("/chat/{conversationId}")
    @SendTo("/topic/conversation/{conversationId}")
    public MessageDTO sendMessage(
            SendMessageRequest request,
            @DestinationVariable Long conversationId,
            Principal principal) throws Exception {

        if (principal == null) {
            throw new Exception("User not authenticated");
        }

        // Extract userId from the authenticated principal
        Long userId = extractUserIdFromPrincipal(principal);

        // Send the message via the service
        MessageDTO messageDTO = chatService.sendMessage(conversationId, userId, request);

        return messageDTO;
    }

    /**
     * Handle typing indicator
     * Client sends to: /app/typing/{conversationId}
     * Broadcasted to: /topic/conversation/{conversationId}/typing
     */
    @MessageMapping("/typing/{conversationId}")
    @SendTo("/topic/conversation/{conversationId}/typing")
    public TypingIndicator sendTypingIndicator(
            @DestinationVariable Long conversationId,
            Principal principal) throws Exception {

        if (principal == null) {
            throw new Exception("User not authenticated");
        }

        Long userId = extractUserIdFromPrincipal(principal);
        TypingIndicator indicator = new TypingIndicator();
        indicator.setUserId(userId);
        indicator.setConversationId(conversationId);
        indicator.setIsTyping(true);

        return indicator;
    }

    /**
     * Handle stop typing indicator
     */
    @MessageMapping("/stopTyping/{conversationId}")
    @SendTo("/topic/conversation/{conversationId}/typing")
    public TypingIndicator sendStopTypingIndicator(
            @DestinationVariable Long conversationId,
            Principal principal) throws Exception {

        if (principal == null) {
            throw new Exception("User not authenticated");
        }

        Long userId = extractUserIdFromPrincipal(principal);
        TypingIndicator indicator = new TypingIndicator();
        indicator.setUserId(userId);
        indicator.setConversationId(conversationId);
        indicator.setIsTyping(false);

        return indicator;
    }

    /**
     * Send message to specific user (private message)
     * Used for read receipts and notifications
     */
    @SuppressWarnings("null")
    public void sendPrivateMessage(Long recipientUserId, String destination, MessageDTO message) {
        messagingTemplate.convertAndSendToUser(
                recipientUserId.toString(),
                destination,
                message);
    }

    /**
     * Helper method to extract userId from Principal
     * Works with JWT tokens via WebSocketChannelInterceptor
     */
    private Long extractUserIdFromPrincipal(Principal principal) {
        if (principal instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) principal;
            return Long.parseLong(userPrincipal.getUserId());
        }
        
        // Fallback for other principal types
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid user ID format: " + principal.getName());
        }
    }

    /**
     * DTO for typing indicators
     */
    public static class TypingIndicator {
        private Long userId;
        private Long conversationId;
        private Boolean isTyping;

        public TypingIndicator() {
        }

        public TypingIndicator(Long userId, Long conversationId, Boolean isTyping) {
            this.userId = userId;
            this.conversationId = conversationId;
            this.isTyping = isTyping;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Long getConversationId() {
            return conversationId;
        }

        public void setConversationId(Long conversationId) {
            this.conversationId = conversationId;
        }

        public Boolean getIsTyping() {
            return isTyping;
        }

        public void setIsTyping(Boolean isTyping) {
            this.isTyping = isTyping;
        }
    }
}
