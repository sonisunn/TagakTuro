package com.example.demo.controller;

import com.example.demo.model.TutorScore;
import com.example.demo.service.TutorScoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/scoring")
public class ScoringController {

    @Autowired
    private TutorScoringService tutorScoringService;

    /**
     * Get tutor score by ID
     * GET /api/scoring/tutor/{id}
     */
    @GetMapping("/tutor/{id}")
    public ResponseEntity<?> getTutorScore(@PathVariable Long id) {
        try {
            TutorScore score = tutorScoringService.getScore(id);
            return ResponseEntity.ok(score);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Calculate/recalculate score for a tutor
     * POST /api/scoring/tutor/{id}/calculate
     */
    @PostMapping("/tutor/{id}/calculate")
    public ResponseEntity<?> calculateTutorScore(@PathVariable Long id) {
        try {
            TutorScore score = tutorScoringService.calculateScore(id);
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("message", "Score calculated successfully");
                put("score", score);
            }});
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Recalculate all tutor scores
     * POST /api/scoring/recalculate-all
     */
    @PostMapping("/recalculate-all")
    public ResponseEntity<?> recalculateAllScores() {
        tutorScoringService.recalculateAllScores();
        return ResponseEntity.ok(new HashMap<String, String>() {{
            put("message", "All tutor scores recalculated successfully");
        }});
    }

    /**
     * Get tutor score as percentage
     * GET /api/scoring/tutor/{id}/percentage
     */
    @GetMapping("/tutor/{id}/percentage")
    public ResponseEntity<?> getTutorScorePercentage(@PathVariable Long id) {
        try {
            var percentage = tutorScoringService.getScorePercentage(id);
            Map<String, Object> response = new HashMap<>();
            response.put("tutorId", id);
            response.put("scorePercentage", percentage + "%");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }
}