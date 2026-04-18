package com.example.demo.repository;

import com.example.demo.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    List<Feedback> findByBookingId(Long bookingId);
    
    // Check if the user already left feedback for this booking
    Optional<Feedback> findByBookingIdAndReviewerId(Long bookingId, Long reviewerId);

    // Get all feedback given to a specific user (e.g. to calculate average rating)
    List<Feedback> findByRevieweeId(Long revieweeId);
}
