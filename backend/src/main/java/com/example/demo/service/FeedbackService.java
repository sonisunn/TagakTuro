package com.example.demo.service;

import com.example.demo.dto.FeedbackRequest;
import com.example.demo.dto.FeedbackResponse;
import com.example.demo.model.Booking;
import com.example.demo.model.Feedback;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.FeedbackRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    public FeedbackResponse submitFeedback(Long reviewerId, FeedbackRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getStatus().equals(Booking.BookingStatus.COMPLETED)) {
            throw new RuntimeException("Feedback can only be given for completed sessions");
        }

        Optional<Feedback> existingFeedback = feedbackRepository.findByBookingIdAndReviewerId(request.getBookingId(), reviewerId);
        if (existingFeedback.isPresent()) {
            throw new RuntimeException("You have already submitted feedback for this session");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        User reviewee;
        if (request.getRevieweeId() != null && request.getRevieweeId() > 0) {
            reviewee = userRepository.findById(request.getRevieweeId())
                    .orElseThrow(() -> new RuntimeException("Reviewee not found"));
        } else {
            // Auto-detect: if we didn't pass a revieweeId, assume we are rating the student
            com.example.demo.model.Student student = booking.getStudent();
            if (student == null || student.getUser() == null) {
                // Fallback email lookup for old unlinked student records
                reviewee = userRepository.findByEmail(student != null ? student.getEmail() : "").orElseThrow(() -> new RuntimeException("Reviewee student user not found"));
            } else {
                reviewee = student.getUser();
            }
        }

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Feedback feedback = new Feedback();
        feedback.setBooking(booking);
        feedback.setReviewer(reviewer);
        feedback.setReviewee(reviewee);
        feedback.setRating(request.getRating());
        feedback.setComments(request.getComments());

        feedback = feedbackRepository.save(feedback);
        return new FeedbackResponse(feedback);
    }

    public List<FeedbackResponse> getFeedbackForBooking(Long bookingId) {
        return feedbackRepository.findByBookingId(bookingId).stream()
                .map(FeedbackResponse::new)
                .collect(Collectors.toList());
    }

    public List<FeedbackResponse> getFeedbackForUser(Long userId) {
        return feedbackRepository.findByRevieweeId(userId).stream()
                .map(FeedbackResponse::new)
                .collect(Collectors.toList());
    }
}
