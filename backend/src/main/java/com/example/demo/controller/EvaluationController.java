package com.example.demo.controller;

import com.example.demo.dto.EvaluationRequest;
import com.example.demo.model.Evaluation;
import com.example.demo.service.EvaluationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation")
@CrossOrigin(origins = "*")
public class EvaluationController {

    private static final Logger logger = LoggerFactory.getLogger(EvaluationController.class);

    @Autowired
    private EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<?> submitEvaluation(@RequestBody EvaluationRequest request) {
        try {
            Evaluation evaluation = evaluationService.submitEvaluation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "success",
                "message", "Evaluation submitted successfully.",
                "evaluationId", evaluation.getId()
            ));
        } catch (RuntimeException e) {
            logger.warn("Evaluation submission failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Evaluation>> getEvaluationsForBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(evaluationService.getEvaluationsForBooking(bookingId));
    }

    // GET /api/evaluation/check?bookingId=1&type=TUTOR_EVALUATES_STUDENT
    @GetMapping("/check")
    public ResponseEntity<?> checkEvaluated(
            @RequestParam Long bookingId,
            @RequestParam String type) {
        try {
            boolean evaluated = evaluationService.hasEvaluated(bookingId, type);
            return ResponseEntity.ok(Map.of("evaluated", evaluated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid evaluation type: " + type));
        }
    }
}
