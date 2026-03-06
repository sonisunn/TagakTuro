package com.example.demo.repository;

import com.example.demo.model.Message;
import com.example.demo.model.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Find all messages in a conversation
    Page<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);
    
    // Find unread messages for a user in a conversation
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id != :userId AND m.isRead = false")
    List<Message> findUnreadMessagesByConversationAndUser(@Param("conversationId") Long conversationId,
                                                          @Param("userId") Long userId);
    
    // Count unread messages for a user in a conversation
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id != :userId AND m.isRead = false")
    Long countUnreadMessagesByConversationAndUser(@Param("conversationId") Long conversationId,
                                                   @Param("userId") Long userId);
    
    // Find all unread conversations for a user
    @Query("SELECT DISTINCT m.conversation FROM Message m WHERE " +
           "((m.conversation.user1.id = :userId OR m.conversation.user2.id = :userId) " +
           "AND m.sender.id != :userId AND m.isRead = false)")
    List<Conversation> findConversationsWithUnreadMessages(@Param("userId") Long userId);
}
