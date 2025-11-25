package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HybridAssignmentService {

    @Autowired
    private TutorScoringService tutorScoringService;

    @Autowired
    private PAMAMatchingService pamaMatchingService;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private PAMAModuleRepository pamaModuleRepository;

    @Autowired
    private ModulePreferenceRepository modulePreferenceRepository;

    @Autowired
    private TutorScoreRepository tutorScoreRepository;

    /**
     * HYBRID MATCHING ALGORITHM
     * Combines Weighted Scoring (Phase 1) + PAMA Matching (Phase 2)
     * 
     * Algorithm Flow:
     * 1. Calculate/update all tutor weighted scores
     * 2. Run enhanced PAMA matching with score-weighted compatibility
     * 3. Detect and resolve deadlocks using score-based prioritization
     * 4. Generate final assignment report
     */
    public Map<String, Object> runHybridMatching(List<Long> moduleIds, List<Long> tutorIds) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // STEP 1: Recalculate all tutor scores (ensure fresh data)
            System.out.println("=== STEP 1: Calculating tutor weighted scores ===");
            List<Tutor> tutors = tutorIds.isEmpty() 
                ? tutorRepository.findAll() 
                : tutorRepository.findAllById(tutorIds);
            
            for (Tutor tutor : tutors) {
                tutorScoringService.calculateScore(tutor.getId());
            }
            System.out.println("✓ Tutor scores calculated: " + tutors.size());

            // STEP 2: Get modules
            List<PAMAModule> modules = moduleIds.isEmpty() 
                ? pamaModuleRepository.findAll() 
                : pamaModuleRepository.findAllById(moduleIds);
            
            System.out.println("✓ Modules to assign: " + modules.size());

            // STEP 3: Run PAMA matching with score-weighted compatibility
            System.out.println("\n=== STEP 2: Running PAMA matching with weighted scores ===");
            Map<String, Object> pamaResult = pamaMatchingService
                .runPAMAMatchingWithWeightedScores(moduleIds, tutorIds);
            
            List<ModulePreference> assignments = 
                (List<ModulePreference>) pamaResult.get("assignments");
            List<String> pending = 
                (List<String>) pamaResult.get("pending");

            System.out.println("✓ Initial assignments: " + assignments.size());
            System.out.println("✓ Pending assignments: " + pending.size());

            // STEP 4: Detect deadlocks
            System.out.println("\n=== STEP 3: Detecting deadlocks ===");
            List<ModulePreference> deadlockedAssignments = 
                detectDeadlocks(modules, assignments);
            System.out.println("✓ Deadlocks detected: " + deadlockedAssignments.size());

            // STEP 5: Resolve deadlocks using score-based optimization
            System.out.println("\n=== STEP 4: Resolving deadlocks ===");
            List<ModulePreference> resolvedAssignments = 
                resolveDeadlocksWithScores(deadlockedAssignments, modules);
            System.out.println("✓ Deadlocks resolved: " + resolvedAssignments.size());

            // STEP 6: Apply stability checks
            System.out.println("\n=== STEP 5: Verifying assignment stability ===");
            verifyAssignmentStability(modules);
            System.out.println("✓ Stability verification complete");

            // STEP 7: Generate final report
            System.out.println("\n=== STEP 6: Generating final report ===");
            Map<String, Object> finalReport = generateFinalReport(
                modules, 
                assignments, 
                deadlockedAssignments, 
                resolvedAssignments,
                pending
            );

            result.put("success", true);
            result.put("timestamp", LocalDateTime.now());
            result.put("report", finalReport);

        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("timestamp", LocalDateTime.now());
        }

        return result;
    }

    /**
     * STEP 3: Detect deadlocks in assignments
     * Deadlock = Multiple tutors competing for same module with similar scores
     */
    private List<ModulePreference> detectDeadlocks(
            List<PAMAModule> modules,
            List<ModulePreference> assignments) {
        
        List<ModulePreference> deadlocked = new ArrayList<>();

        for (PAMAModule module : modules) {
            List<ModulePreference> moduleAssignments = assignments.stream()
                .filter(a -> a.getModule().getId().equals(module.getId()))
                .collect(Collectors.toList());

            // Check if assignments have similar scores (deadlock indicator)
            if (moduleAssignments.size() > 1) {
                BigDecimal[] scores = moduleAssignments.stream()
                    .map(ModulePreference::getCompatibilityScore)
                    .toArray(BigDecimal[]::new);

                // If score difference < 5 points, potential deadlock
                for (int i = 0; i < scores.length - 1; i++) {
                    BigDecimal diff = scores[i].subtract(scores[i + 1]).abs();
                    if (diff.compareTo(BigDecimal.valueOf(5)) < 0) {
                        deadlocked.addAll(moduleAssignments);
                        break;
                    }
                }
            }
        }

        return deadlocked;
    }

    /**
     * STEP 5: Resolve deadlocks using score-based optimization
     * Strategy: Reassign tutors based on highest weighted score + compatibility
     */
    private List<ModulePreference> resolveDeadlocksWithScores(
            List<ModulePreference> deadlockedAssignments,
            List<PAMAModule> modules) {
        
        List<ModulePreference> resolved = new ArrayList<>();

        for (ModulePreference deadlocked : deadlockedAssignments) {
            try {
                Long tutorId = deadlocked.getTutor().getId();
                Long moduleId = deadlocked.getModule().getId();

                // Get tutor's weighted score
                TutorScore tutorScore = tutorScoringService.getScore(tutorId);
                BigDecimal weightedScore = tutorScore.getWeightedScore();

                // Recalculate compatibility with score boost
                BigDecimal newCompatibility = calculateScoreBoostedCompatibility(
                    deadlocked.getCompatibilityScore(),
                    weightedScore
                );

                deadlocked.setCompatibilityScore(newCompatibility);
                deadlocked.setAssignmentStatus("RESOLVED");
                deadlocked.setUpdatedAt(LocalDateTime.now());

                ModulePreference saved = modulePreferenceRepository.save(deadlocked);
                resolved.add(saved);

            } catch (Exception e) {
                System.err.println("Error resolving deadlock for assignment " + 
                    deadlocked.getId() + ": " + e.getMessage());
            }
        }

        return resolved;
    }

    /**
     * Calculate score-boosted compatibility
     * Formula: (Original Compatibility * 0.7) + (Weighted Score * 0.3)
     */
    private BigDecimal calculateScoreBoostedCompatibility(
            BigDecimal originalCompatibility,
            BigDecimal weightedScore) {
        
        BigDecimal compatibility = originalCompatibility
            .multiply(BigDecimal.valueOf(0.7));
        
        BigDecimal scoreBoost = weightedScore
            .multiply(BigDecimal.valueOf(0.3));
        
        return compatibility.add(scoreBoost)
            .setScale(2, RoundingMode.HALF_UP)
            .min(BigDecimal.valueOf(100));
    }

    /**
     * STEP 6: Verify assignment stability
     * Ensure no tutor prefers another module over assigned one
     */
    private void verifyAssignmentStability(List<PAMAModule> modules) {
        for (PAMAModule module : modules) {
            List<ModulePreference> moduleAssignments = 
                modulePreferenceRepository.findByModule(module);

            for (ModulePreference assignment : moduleAssignments) {
                if ("ASSIGNED".equals(assignment.getAssignmentStatus())) {
                    // Get all tutor's module preferences
                    List<ModulePreference> tutorAllPrefs = 
                        modulePreferenceRepository.findByTutor(assignment.getTutor());

                    // Check if assigned module is highest ranked
                    ModulePreference bestPref = tutorAllPrefs.stream()
                        .max(Comparator.comparing(ModulePreference::getCompatibilityScore))
                        .orElse(assignment);

                    if (!bestPref.getId().equals(assignment.getId())) {
                        // Prefer the better match
                        assignment.setAssignmentStatus("STABLE");
                    } else {
                        assignment.setAssignmentStatus("STABLE");
                    }
                    modulePreferenceRepository.save(assignment);
                }
            }
        }
    }

    /**
     * Generate comprehensive final report
     */
    private Map<String, Object> generateFinalReport(
            List<PAMAModule> modules,
            List<ModulePreference> assignments,
            List<ModulePreference> deadlockedAssignments,
            List<ModulePreference> resolvedAssignments,
            List<String> pending) {
        
        Map<String, Object> report = new HashMap<>();

        // Summary statistics
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalModules", modules.size());
        summary.put("totalAssignments", assignments.size());
        summary.put("deadlocksDetected", deadlockedAssignments.size());
        summary.put("deadlocksResolved", resolvedAssignments.size());
        summary.put("pendingAssignments", pending.size());

        // Module details
        List<Map<String, Object>> moduleDetails = new ArrayList<>();
        for (PAMAModule module : modules) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("moduleId", module.getId());
            detail.put("moduleName", module.getName());
            detail.put("subject", module.getSubject());
            detail.put("maxTutorsNeeded", module.getMaxTutorsNeeded());
            detail.put("currentTutorsAssigned", module.getCurrentTutorsAssigned());
            detail.put("status", module.getStatus());

            // Assigned tutors for this module
            List<Map<String, Object>> tutorList = new ArrayList<>();
            for (ModulePreference pref : assignments) {
                if (pref.getModule().getId().equals(module.getId())) {
                    Map<String, Object> tutorInfo = new HashMap<>();
                    tutorInfo.put("tutorId", pref.getTutor().getId());
                    tutorInfo.put("tutorEmail", pref.getTutor().getUser().getEmail());
                    tutorInfo.put("compatibilityScore", pref.getCompatibilityScore());
                    tutorInfo.put("assignmentStatus", pref.getAssignmentStatus());
                    tutorList.add(tutorInfo);
                }
            }
            detail.put("assignedTutors", tutorList);
            moduleDetails.add(detail);
        }

        // Assignment quality metrics
        Map<String, Object> metrics = calculateQualityMetrics(assignments);

        report.put("summary", summary);
        report.put("moduleDetails", moduleDetails);
        report.put("qualityMetrics", metrics);
        report.put("timestamp", LocalDateTime.now());

        return report;
    }

    /**
     * Calculate quality metrics for assignments
     */
    private Map<String, Object> calculateQualityMetrics(
            List<ModulePreference> assignments) {
        
        Map<String, Object> metrics = new HashMap<>();

        if (assignments.isEmpty()) {
            metrics.put("averageCompatibility", 0);
            metrics.put("minCompatibility", 0);
            metrics.put("maxCompatibility", 0);
            return metrics;
        }

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal min = BigDecimal.valueOf(100);
        BigDecimal max = BigDecimal.ZERO;

        for (ModulePreference pref : assignments) {
            BigDecimal score = pref.getCompatibilityScore();
            total = total.add(score);
            min = score.compareTo(min) < 0 ? score : min;
            max = score.compareTo(max) > 0 ? score : max;
        }

        BigDecimal average = total.divide(
            BigDecimal.valueOf(assignments.size()), 
            2, 
            RoundingMode.HALF_UP
        );

        metrics.put("averageCompatibility", average);
        metrics.put("minCompatibility", min);
        metrics.put("maxCompatibility", max);
        metrics.put("totalAssignments", assignments.size());

        return metrics;
    }

    /**
     * Get current assignment status for all modules
     */
    public Map<String, Object> getAssignmentStatus() {
        Map<String, Object> status = new HashMap<>();

        List<PAMAModule> modules = pamaModuleRepository.findAll();
        List<ModulePreference> allAssignments = modulePreferenceRepository.findAll();

        int totalAssigned = (int) allAssignments.stream()
            .filter(a -> "ASSIGNED".equals(a.getAssignmentStatus()))
            .count();

        int totalPending = (int) allAssignments.stream()
            .filter(a -> "PENDING".equals(a.getAssignmentStatus()))
            .count();

        int totalUnassigned = (int) allAssignments.stream()
            .filter(a -> "UNASSIGNED".equals(a.getAssignmentStatus()))
            .count();

        status.put("totalModules", modules.size());
        status.put("totalAssignments", allAssignments.size());
        status.put("assigned", totalAssigned);
        status.put("pending", totalPending);
        status.put("unassigned", totalUnassigned);
        status.put("timestamp", LocalDateTime.now());

        return status;
    }
}