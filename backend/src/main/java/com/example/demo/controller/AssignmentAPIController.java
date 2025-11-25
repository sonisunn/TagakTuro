package com.example.demo.controller;

import com.example.demo.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Complete Assignment & Scoring API
 * Combines all Phase 1-4 functionality
 */
@RestController
@RequestMapping("/api/v1/assignments")
public class AssignmentAPIController {

    @Autowired
    private TutorScoringService tutorScoringService;

    @Autowired
    private PAMAMatchingService pamaMatchingService;

    @Autowired
    private HybridAssignmentService hybridAssignmentService;

    @Autowired
    private DeadlockDetectionService deadlockDetectionService;

    @Autowired
    private DeadlockResolutionService deadlockResolutionService;

    @Autowired
    private AssignmentOptimizer assignmentOptimizer;

    // ========================
    // PHASE 1: SCORING ENDPOINTS
    // ========================

    /**
     * GET /api/v1/assignments/scores/tutor/{tutorId}
     * Get weighted score for a specific tutor
     * 
     * @param tutorId The tutor ID
     * @return TutorScore object with all components
     */
    @GetMapping("/scores/tutor/{tutorId}")
    public ResponseEntity<?> getTutorScore(@PathVariable Long tutorId) {
        try {
            var score = tutorScoringService.getScore(tutorId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", score);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * POST /api/v1/assignments/scores/tutor/{tutorId}/calculate
     * Calculate or recalculate weighted score for tutor
     * 
     * @param tutorId The tutor ID
     * @return Updated TutorScore object
     */
    @PostMapping("/scores/tutor/{tutorId}/calculate")
    public ResponseEntity<?> calculateTutorScore(@PathVariable Long tutorId) {
        try {
            var score = tutorScoringService.calculateScore(tutorId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Score calculated successfully");
            response.put("data", score);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/assignments/scores/tutor/{tutorId}/percentage
     * Get tutor score as percentage (0-100)
     * 
     * @param tutorId The tutor ID
     * @return Score percentage
     */
    @GetMapping("/scores/tutor/{tutorId}/percentage")
    public ResponseEntity<?> getTutorScorePercentage(@PathVariable Long tutorId) {
        try {
            var percentage = tutorScoringService.getScorePercentage(tutorId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tutorId", tutorId);
            response.put("scorePercentage", percentage + "%");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * POST /api/v1/assignments/scores/recalculate-all
     * Recalculate weighted scores for all tutors
     * 
     * @return Operation result
     */
    @PostMapping("/scores/recalculate-all")
    public ResponseEntity<?> recalculateAllScores() {
        try {
            tutorScoringService.recalculateAllScores();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All tutor scores recalculated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    // ========================
    // PHASE 2: PAMA MATCHING ENDPOINTS
    // ========================

    /**
     * GET /api/v1/assignments/module/{moduleId}/assignments
     * Get all tutor assignments for a specific module
     * 
     * @param moduleId The module ID
     * @return List of module preference assignments
     */
    @GetMapping("/module/{moduleId}/assignments")
    public ResponseEntity<?> getModuleAssignments(@PathVariable Long moduleId) {
        try {
            var assignments = pamaMatchingService.getModuleAssignments(moduleId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("moduleId", moduleId);
            response.put("count", assignments.size());
            response.put("data", assignments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/assignments/tutor/{tutorId}/assignments
     * Get all module assignments for a specific tutor
     * 
     * @param tutorId The tutor ID
     * @return List of module preferences
     */
    @GetMapping("/tutor/{tutorId}/assignments")
    public ResponseEntity<?> getTutorAssignments(@PathVariable Long tutorId) {
        try {
            var assignments = pamaMatchingService.getTutorAssignments(tutorId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tutorId", tutorId);
            response.put("count", assignments.size());
            response.put("data", assignments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/assignments/pending
     * Get all pending assignments awaiting manual intervention
     * 
     * @return List of pending assignments
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingAssignments() {
        try {
            var pending = pamaMatchingService.getPendingAssignments();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", pending.size());
            response.put("data", pending);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    // ========================
    // PHASE 3: HYBRID MATCHING ENDPOINTS
    // ========================

    /**
     * POST /api/v1/assignments/hybrid/match
     * Run FULL HYBRID MATCHING (Scoring + PAMA + Deadlock Resolution)
     * MAIN ENDPOINT - Use this for complete assignment process
     * 
     * Request body (optional):
     * {
     *   "moduleIds": [1, 2, 3],
     *   "tutorIds": [1, 2, 3, 4, 5]
     * }
     * 
     * If empty/null, matches ALL modules with ALL tutors
     * 
     * @param request Optional filter for specific modules/tutors
     * @return Comprehensive matching report
     */
    @PostMapping("/hybrid/match")
    public ResponseEntity<?> runHybridMatching(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        List<Long> tutorIds = request != null ? request.getOrDefault("tutorIds", List.of()) : List.of();

        try {
            Map<String, Object> result = hybridAssignmentService
                .runHybridMatching(moduleIds, tutorIds);
            
            if ((Boolean) result.get("success")) {
                result.put("apiVersion", "v1");
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/assignments/status
     * Get overall assignment status and statistics
     * 
     * @return Current status of all assignments
     */
    @GetMapping("/status")
    public ResponseEntity<?> getAssignmentStatus() {
        try {
            var status = hybridAssignmentService.getAssignmentStatus();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    // ========================
    // PHASE 4: DEADLOCK DETECTION & RESOLUTION ENDPOINTS
    // ========================

    /**
     * GET /api/v1/assignments/deadlock/detect
     * Detect all types of deadlocks in current assignments
     * Returns: Score deadlocks, Preference deadlocks, Capacity deadlocks, Conflict deadlocks
     * 
     * @return Comprehensive deadlock report
     */
    @GetMapping("/deadlock/detect")
    public ResponseEntity<?> detectDeadlocks() {
        try {
            Map<String, Object> deadlocks = deadlockDetectionService.detectAllDeadlocks();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", deadlocks);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/assignments/deadlock/count-critical
     * Count critical deadlocks (high severity)
     * 
     * @return Number of critical deadlocks
     */
    @GetMapping("/deadlock/count-critical")
    public ResponseEntity<?> countCriticalDeadlocks() {
        try {
            int critical = deadlockDetectionService.countCriticalDeadlocks();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("criticalDeadlocks", critical);
            response.put("requiresManualIntervention", critical > 0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * POST /api/v1/assignments/deadlock/resolve/score-based
     * AUTO-RESOLVE deadlocks using SCORE-BASED PRIORITY
     * RECOMMENDED METHOD for deadlock resolution
     * 
     * Request body (optional):
     * { "moduleIds": [1, 2, 3] }
     * 
     * @param request Optional filter for specific modules
     * @return Resolution result
     */
    @PostMapping("/deadlock/resolve/score-based")
    public ResponseEntity<?> resolveScoreDeadlocks(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveScoreDeadlocks(moduleIds);
            result.put("apiVersion", "v1");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * POST /api/v1/assignments/deadlock/resolve/experience-based/{moduleId}
     * Resolve deadlocks using EXPERIENCE-BASED PRIORITY
     * Preferred when experience is most important criterion
     * 
     * @param moduleId The module ID to resolve
     * @return Resolution result
     */
    @PostMapping("/deadlock/resolve/experience-based/{moduleId}")
    public ResponseEntity<?> resolveExperienceDeadlocks(@PathVariable Long moduleId) {
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveExperienceDeadlocks(moduleId);
            result.put("apiVersion", "v1");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * POST /api/v1/assignments/deadlock/resolve/rating-based/{moduleId}
     * Resolve deadlocks using RATING-BASED PRIORITY
     * Preferred when student ratings are most important
     * 
     * @param moduleId The module ID to resolve
     * @return Resolution result
     */
    @PostMapping("/deadlock/resolve/rating-based/{moduleId}")
    public ResponseEntity<?> resolveRatingDeadlocks(@PathVariable Long moduleId) {
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveRatingDeadlocks(moduleId);
            result.put("apiVersion", "v1");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * POST /api/v1/assignments/deadlock/resolve/module-priority
     * Resolve deadlocks using MODULE PRIORITY-BASED strategy
     * Assigns best tutors to highest priority modules first
     * 
     * Request body (optional):
     * { "moduleIds": [1, 2, 3] }
     * 
     * @param request Optional filter
     * @return Resolution result
     */
    @PostMapping("/deadlock/resolve/module-priority")
    public ResponseEntity<?> resolveModulePriorityDeadlocks(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveByModulePriority(moduleIds);
            result.put("apiVersion", "v1");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * POST /api/v1/assignments/deadlock/resolve/round-robin
     * Resolve deadlocks using ROUND-ROBIN DISTRIBUTION
     * Fair distribution across all modules
     * 
     * Request body (optional):
     * {
     *   "moduleIds": [1, 2, 3],
     *   "tutorIds": [1, 2, 3, 4]
     * }
     * 
     * @param request Optional filters
     * @return Resolution result
     */
    @PostMapping("/deadlock/resolve/round-robin")
    public ResponseEntity<?> resolveRoundRobinDeadlocks(
            @RequestBody(required = false) Map<String, List<Long>> request) {
        
        List<Long> moduleIds = request != null ? request.getOrDefault("moduleIds", List.of()) : List.of();
        List<Long> tutorIds = request != null ? request.getOrDefault("tutorIds", List.of()) : List.of();
        
        try {
            Map<String, Object> result = deadlockResolutionService
                .resolveRoundRobin(moduleIds, tutorIds);
            result.put("apiVersion", "v1");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    // ========================
    // PHASE 4: OPTIMIZATION ENDPOINTS
    // ========================

    /**
     * POST /api/v1/assignments/optimize?iterations=5
     * Optimize assignments through iterative refinement
     * Improves global satisfaction score with each iteration
     * 
     * @param iterations Number of optimization iterations (default: 5)
     * @return Optimization report with improvement metrics
     */
    @PostMapping("/optimize")
    public ResponseEntity<?> optimizeAssignments(
            @RequestParam(defaultValue = "5") int iterations) {
        
        try {
            Map<String, Object> result = assignmentOptimizer
                .optimizeAssignmentsIterative(iterations);
            result.put("apiVersion", "v1");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/assignments/optimization-report
     * Get comprehensive optimization report
     * Shows: Global optimality score, fill rate, fairness metrics
     * 
     * @return Optimization metrics report
     */
    @GetMapping("/optimization-report")
    public ResponseEntity<?> getOptimizationReport() {
        try {
            Map<String, Object> report = assignmentOptimizer.getOptimizationReport();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", report);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }
}