package com.example.demo.service;

import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.MessageDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.model.Conversation;
import com.example.demo.model.Message;
import com.example.demo.model.User;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Start a new conversation between two users or get existing conversation
     */
    public ConversationDTO startConversation(Long userId1, Long userId2) {
        if (userId1.equals(userId2)) {
            throw new IllegalArgumentException("Cannot create conversation with yourself");
        }

        // Find existing conversation
        Optional<Conversation> existing = conversationRepository.findByUserPair(userId1, userId2);
        if (existing.isPresent()) {
            return convertToDTO(existing.get(), userId1);
        }

        // Create new conversation
        @SuppressWarnings("null")
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId1));
        @SuppressWarnings("null")
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId2));

        Conversation conversation = new Conversation();
        conversation.setUser1(user1);
        conversation.setUser2(user2);
        Conversation saved = conversationRepository.save(conversation);

        return convertToDTO(saved, userId1);
    }

    /**
     * Send a message in a conversation
     */
    @SuppressWarnings("null")
    public MessageDTO sendMessage(Long conversationId, Long senderId, SendMessageRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found: " + senderId));

        // Verify sender is part of conversation
        if (!isUserInConversation(senderId, conversation)) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent());
        message.setMessageType(Message.MessageType.valueOf(
                request.getMessageType() != null ? request.getMessageType() : "TEXT"));
        message.setIsRead(false);

        Message saved = messageRepository.save(message);

        // Update conversation last message and timestamp
        conversation.setLastMessage(saved);
        conversationRepository.save(conversation);

        return convertMessageToDTO(saved);
    }

    /**
     * Get message history for a conversation (paginated)
     */
    public Page<MessageDTO> getMessageHistory(Long conversationId, Long userId, int page, int size) {
        verifyUserInConversation(userId, conversationId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        return messages.map(this::convertMessageToDTO);
    }

    /**
     * Get all conversations for a user (paginated)
     */
    public Page<ConversationDTO> getUserConversations(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> conversations = conversationRepository.findByUserId(userId, pageable);

        return conversations.map(conv -> convertToDTO(conv, userId));
    }

    /**
     * Mark a message as read
     */
    @SuppressWarnings("null")
    public MessageDTO markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found: " + messageId));

        // Verify user is in the conversation
        if (!isUserInConversation(userId, message.getConversation())) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }

        message.setIsRead(true);
        message.setReadAt(LocalDateTime.now());
        Message saved = messageRepository.save(message);

        return convertMessageToDTO(saved);
    }

    /**
     * Mark all messages in a conversation as read
     */
    public void markConversationAsRead(Long conversationId, Long userId) {
        verifyUserInConversation(userId, conversationId);

        List<Message> unreadMessages = messageRepository.findUnreadMessagesByConversationAndUser(
                conversationId, userId);

        LocalDateTime now = LocalDateTime.now();
        unreadMessages.forEach(msg -> {
            msg.setIsRead(true);
            msg.setReadAt(now);
        });

        messageRepository.saveAll(unreadMessages);
    }

    /**
     * Get unread message count for a conversation
     */
    public Long getUnreadMessageCount(Long conversationId, Long userId) {
        verifyUserInConversation(userId, conversationId);
        return messageRepository.countUnreadMessagesByConversationAndUser(conversationId, userId);
    }

    /**
     * Get a specific conversation
     */
    @SuppressWarnings("null")
    public ConversationDTO getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        verifyUserInConversation(userId, conversation);
        return convertToDTO(conversation, userId);
    }

    /**
     * Get or create a conversation between two users
     */
    @SuppressWarnings("null")
    public ConversationDTO getOrCreateConversation(Long userId1, Long userId2) {
        Optional<Conversation> existing = conversationRepository.findByUserPair(userId1, userId2);
        if (existing.isPresent()) {
            return convertToDTO(existing.get(), userId1);
        }
        return startConversation(userId1, userId2);
    }

    /**
     * Delete a conversation (soft delete or hard delete)
     */
    @SuppressWarnings("null")
    public void deleteConversation(Long conversationId, Long userId) {
        @SuppressWarnings("null")
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        verifyUserInConversation(userId, conversation);
        conversationRepository.delete(conversation);
    }

    /**
     * Search conversations by user name
     */
    public List<ConversationDTO> searchConversations(Long currentUserId, String searchTerm) {
        List<Conversation> conversations = conversationRepository.findAllByUserId(currentUserId);

        return conversations.stream()
                .filter(conv -> {
                    User otherUser = getOtherUser(currentUserId, conv);
                    return otherUser.getName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                            otherUser.getEmail().toLowerCase().contains(searchTerm.toLowerCase());
                })
                .map(conv -> convertToDTO(conv, currentUserId))
                .collect(Collectors.toList());
    }

    // Helper methods

    private void verifyUserInConversation(Long userId, Long conversationId) {
        @SuppressWarnings("null")
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));
        if (!isUserInConversation(userId, conversation)) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }
    }

    private void verifyUserInConversation(Long userId, Conversation conversation) {
        if (!isUserInConversation(userId, conversation)) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }
    }

    private boolean isUserInConversation(Long userId, Conversation conversation) {
        return conversation.getUser1().getId().equals(userId) ||
                conversation.getUser2().getId().equals(userId);
    }

    private User getOtherUser(Long currentUserId, Conversation conversation) {
        if (conversation.getUser1().getId().equals(currentUserId)) {
            return conversation.getUser2();
        }
        return conversation.getUser1();
    }

    private ConversationDTO convertToDTO(Conversation conversation, Long currentUserId) {
        MessageDTO lastMessageDTO = null;
        if (conversation.getLastMessage() != null) {
            lastMessageDTO = convertMessageToDTO(conversation.getLastMessage());
        }

        Long unreadCount = messageRepository.countUnreadMessagesByConversationAndUser(
                conversation.getId(), currentUserId);

        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setUser1Id(conversation.getUser1().getId());
        dto.setUser1Name(conversation.getUser1().getName());
        dto.setUser2Id(conversation.getUser2().getId());
        dto.setUser2Name(conversation.getUser2().getName());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setUpdatedAt(conversation.getUpdatedAt());
        dto.setLastMessage(lastMessageDTO);
        dto.setUnreadCount(unreadCount);

        return dto;
    }

    private MessageDTO convertMessageToDTO(Message message) {
        return new MessageDTO(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getContent(),
                message.getCreatedAt(),
                message.getIsRead(),
                message.getReadAt(),
                message.getMessageType().toString());
    }
}
