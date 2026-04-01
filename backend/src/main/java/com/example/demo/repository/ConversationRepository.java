package com.example.demo.repository;

import com.example.demo.model.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    // Find conversation between two users
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.user1.id = :user1Id AND c.user2.id = :user2Id) OR " +
           "(c.user1.id = :user2Id AND c.user2.id = :user1Id)")
    Optional<Conversation> findByUserPair(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
    
    // Find all conversations for a user, ordered by last update
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.user1.id = :userId OR c.user2.id = :userId) " +
           "ORDER BY c.updatedAt DESC")
    Page<Conversation> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    // Find all conversations for a user without pagination
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.user1.id = :userId OR c.user2.id = :userId) " +
           "ORDER BY c.updatedAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") Long userId);
}
