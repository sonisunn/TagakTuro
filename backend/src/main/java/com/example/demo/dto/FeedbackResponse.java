package com.example.demo.dto;

import com.example.demo.model.Feedback;
import java.time.LocalDateTime;

public class FeedbackResponse {
    private Long id;
    private Long bookingId;
    private Long reviewerId;
    private String reviewerName;
    private Long revieweeId;
    private String revieweeName;
    private Integer rating;
    private String comments;
    private LocalDateTime createdAt;

    public FeedbackResponse(Feedback feedback) {
        this.id = feedback.getId();
        this.bookingId = feedback.getBooking().getId();
        this.reviewerId = feedback.getReviewer().getId();
        this.reviewerName = feedback.getReviewer().getName();
        this.revieweeId = feedback.getReviewee().getId();
        this.revieweeName = feedback.getReviewee().getName();
        this.rating = feedback.getRating();
        this.comments = feedback.getComments();
        this.createdAt = feedback.getCreatedAt();
    }

    public Long getId() { return id; }
    public Long getBookingId() { return bookingId; }
    public Long getReviewerId() { return reviewerId; }
    public String getReviewerName() { return reviewerName; }
    public Long getRevieweeId() { return revieweeId; }
    public String getRevieweeName() { return revieweeName; }
    public Integer getRating() { return rating; }
    public String getComments() { return comments; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
