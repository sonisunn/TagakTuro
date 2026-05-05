package com.example.demo.controller;

import com.example.demo.dto.FeedbackRequest;
import com.example.demo.dto.FeedbackResponse;
import com.example.demo.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @RequestParam Long reviewerId,
            @RequestBody FeedbackRequest request) {
        return ResponseEntity.ok(feedbackService.submitFeedback(reviewerId, request));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<FeedbackResponse>> getFeedbackForBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForBooking(bookingId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FeedbackResponse>> getFeedbackForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForUser(userId));
    }

    @GetMapping("/student/{userId}")
    public ResponseEntity<List<FeedbackResponse>> getFeedbackForStudent(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForUser(userId));
    }
}
