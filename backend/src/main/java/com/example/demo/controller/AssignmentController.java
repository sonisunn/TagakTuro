package com.example.demo.controller;

import com.example.demo.service.HybridAssignmentService;
import com.example.demo.service.PAMAMatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignment")
public class AssignmentController {

    @Autowired
    private HybridAssignmentService hybridAssignmentService;

    @Autowired
    private PAMAMatchingService pamaMatchingService;

    /**
     * Run hybrid matching (Scoring + PAMA)
     * POST /api/assignment/match
     * 
     * Request body (optional):
     * {
     *   "moduleIds": [1, 2, 3],
     *   "tutorIds": [1, 2, 3, 4]
     * }
     */
    @PostMapping("/match")
    public ResponseEntity<?> runHybridMatching(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        List<Long> tutorIds = request != null ? request.getOrDefault("tutorIds", List.of()) : List.of();

        try {
            Map<String, Object> result = hybridAssignmentService
                .runHybridMatching(moduleIds, tutorIds);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Get pending assignments
     * GET /api/assignment/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingAssignments() {
        try {
            var pending = pamaMatchingService.getPendingAssignments();
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("count", pending.size());
                put("assignments", pending);
            }});
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Get all assignments for a module
     * GET /api/assignment/module/{moduleId}
     */
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<?> getModuleAssignments(@PathVariable Long moduleId) {
        try {
            var assignments = pamaMatchingService.getModuleAssignments(moduleId);
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("moduleId", moduleId);
                put("count", assignments.size());
                put("assignments", assignments);
            }});
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Get all assignments for a tutor
     * GET /api/assignment/tutor/{tutorId}
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<?> getTutorAssignments(@PathVariable Long tutorId) {
        try {
            var assignments = pamaMatchingService.getTutorAssignments(tutorId);
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("tutorId", tutorId);
                put("count", assignments.size());
                put("assignments", assignments);
            }});
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Get overall assignment status
     * GET /api/assignment/status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getAssignmentStatus() {
        try {
            var status = hybridAssignmentService.getAssignmentStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }
}