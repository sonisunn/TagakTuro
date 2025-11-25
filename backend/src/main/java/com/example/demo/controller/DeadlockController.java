package com.example.demo.controller;

import com.example.demo.service.DeadlockDetectionService;
import com.example.demo.service.DeadlockResolutionService;
import com.example.demo.service.AssignmentOptimizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deadlock")
public class DeadlockController {

    @Autowired
    private DeadlockDetectionService deadlockDetectionService;

    @Autowired
    private DeadlockResolutionService deadlockResolutionService;

    @Autowired
    private AssignmentOptimizer assignmentOptimizer;

    /**
     * Detect all types of deadlocks
     * GET /api/deadlock/detect
     */
    @GetMapping("/detect")
    public ResponseEntity<?> detectDeadlocks() {
        try {
            Map<String, Object> deadlocks = deadlockDetectionService.detectAllDeadlocks();
            return ResponseEntity.ok(deadlocks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Count critical deadlocks
     * GET /api/deadlock/count-critical
     */
    @GetMapping("/count-critical")
    public ResponseEntity<?> countCriticalDeadlocks() {
        try {
            int critical = deadlockDetectionService.countCriticalDeadlocks();
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("criticalDeadlocks", critical);
            }});
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Resolve deadlocks using SCORE-BASED PRIORITY (Recommended)
     * POST /api/deadlock/resolve/score-based
     * 
     * Body (optional):
     * { "moduleIds": [1, 2, 3] }
     */
    @PostMapping("/resolve/score-based")
    public ResponseEntity<?> resolveScoreDeadlocks(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveScoreDeadlocks(moduleIds);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Resolve deadlocks using EXPERIENCE-BASED PRIORITY
     * POST /api/deadlock/resolve/experience-based/{moduleId}
     */
    @PostMapping("/resolve/experience-based/{moduleId}")
    public ResponseEntity<?> resolveExperienceDeadlocks(@PathVariable Long moduleId) {
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveExperienceDeadlocks(moduleId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Resolve deadlocks using RATING-BASED PRIORITY
     * POST /api/deadlock/resolve/rating-based/{moduleId}
     */
    @PostMapping("/resolve/rating-based/{moduleId}")
    public ResponseEntity<?> resolveRatingDeadlocks(@PathVariable Long moduleId) {
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveRatingDeadlocks(moduleId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Resolve deadlocks using MODULE PRIORITY
     * POST /api/deadlock/resolve/module-priority
     */
    @PostMapping("/resolve/module-priority")
    public ResponseEntity<?> resolveModulePriorityDeadlocks(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveByModulePriority(moduleIds);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Resolve deadlocks using ROUND-ROBIN
     * POST /api/deadlock/resolve/round-robin
     */
    @PostMapping("/resolve/round-robin")
    public ResponseEntity<?> resolveRoundRobinDeadlocks(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        List<Long> tutorIds = request != null ? request.getOrDefault("tutorIds", List.of()) : List.of();
        
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveRoundRobin(moduleIds, tutorIds);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Optimize assignments iteratively
     * POST /api/deadlock/optimize?iterations=5
     */
    @PostMapping("/optimize")
    public ResponseEntity<?> optimizeAssignments(
            @RequestParam(defaultValue = "5") int iterations) {
        
        try {
            Map<String, Object> result = assignmentOptimizer
                .optimizeAssignmentsIterative(iterations);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Get optimization report
     * GET /api/deadlock/optimization-report
     */
    @GetMapping("/optimization-report")
    public ResponseEntity<?> getOptimizationReport() {
        try {
            Map<String, Object> report = assignmentOptimizer.getOptimizationReport();
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, String>() {{
                put("error", e.getMessage());
            }});
        }
    }
}