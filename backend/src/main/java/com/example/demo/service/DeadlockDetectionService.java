package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeadlockDetectionService {

    @Autowired
    private ModulePreferenceRepository modulePreferenceRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private PAMAModuleRepository pamaModuleRepository;

    /**
     * DEADLOCK DETECTION ALGORITHM
     * 
     * Types of deadlocks:
     * 1. Score Deadlock: Multiple tutors with similar compatibility scores
     * 2. Preference Deadlock: Circular preferences (A wants B, B wants C, C wants A)
     * 3. Capacity Deadlock: More qualified tutors than available slots
     * 4. Conflict Deadlock: Two tutors competing for same limited slot
     */
    public Map<String, Object> detectAllDeadlocks() {
        Map<String, Object> result = new HashMap<>();
        
        List<Map<String, Object>> scoreDeadlocks = detectScoreDeadlocks();
        List<Map<String, Object>> preferenceDeadlocks = detectPreferenceDeadlocks();
        List<Map<String, Object>> capacityDeadlocks = detectCapacityDeadlocks();
        List<Map<String, Object>> conflictDeadlocks = detectConflictDeadlocks();

        result.put("totalDeadlocks", 
            scoreDeadlocks.size() + preferenceDeadlocks.size() + 
            capacityDeadlocks.size() + conflictDeadlocks.size());
        result.put("scoreDeadlocks", scoreDeadlocks);
        result.put("preferenceDeadlocks", preferenceDeadlocks);
        result.put("capacityDeadlocks", capacityDeadlocks);
        result.put("conflictDeadlocks", conflictDeadlocks);
        result.put("timestamp", LocalDateTime.now());

        return result;
    }

    /**
     * DEADLOCK TYPE 1: Score Deadlock
     * When two or more tutors have compatibility scores within threshold
     * Threshold: < 5 points difference
     */
    private List<Map<String, Object>> detectScoreDeadlocks() {
        List<Map<String, Object>> scoreDeadlocks = new ArrayList<>();
        final BigDecimal THRESHOLD = BigDecimal.valueOf(5);

        List<PAMAModule> modules = pamaModuleRepository.findAll();

        for (PAMAModule module : modules) {
            List<ModulePreference> prefs = modulePreferenceRepository.findByModule(module);
            
            // Group by status
            List<ModulePreference> assigned = prefs.stream()
                .filter(p -> "ASSIGNED".equals(p.getAssignmentStatus()))
                .sorted((p1, p2) -> p2.getCompatibilityScore()
                    .compareTo(p1.getCompatibilityScore()))
                .collect(Collectors.toList());

            List<ModulePreference> pending = prefs.stream()
                .filter(p -> "PENDING".equals(p.getAssignmentStatus()))
                .collect(Collectors.toList());

            // Check score proximity between assigned and pending
            for (ModulePreference assignedPref : assigned) {
                for (ModulePreference pendingPref : pending) {
                    BigDecimal diff = assignedPref.getCompatibilityScore()
                        .subtract(pendingPref.getCompatibilityScore())
                        .abs();

                    if (diff.compareTo(THRESHOLD) < 0) {
                        Map<String, Object> deadlock = new HashMap<>();
                        deadlock.put("type", "SCORE_DEADLOCK");
                        deadlock.put("moduleId", module.getId());
                        deadlock.put("moduleName", module.getName());
                        deadlock.put("assignedTutor", assignedPref.getTutor().getUser().getEmail());
                        deadlock.put("assignedScore", assignedPref.getCompatibilityScore());
                        deadlock.put("pendingTutor", pendingPref.getTutor().getUser().getEmail());
                        deadlock.put("pendingScore", pendingPref.getCompatibilityScore());
                        deadlock.put("scoreDifference", diff);
                        deadlock.put("severity", calculateSeverity(diff));
                        deadlock.put("detectedAt", LocalDateTime.now());
                        
                        scoreDeadlocks.add(deadlock);
                    }
                }
            }
        }

        return scoreDeadlocks;
    }

    /**
     * DEADLOCK TYPE 2: Preference Deadlock
     * Circular or conflicting preferences
     * Example: Tutor A prefers Module X, Tutor B prefers Module Y,
     *          but Tutor B is better for Module X
     */
    private List<Map<String, Object>> detectPreferenceDeadlocks() {
        List<Map<String, Object>> preferenceDeadlocks = new ArrayList<>();

        List<Tutor> tutors = tutorRepository.findAll();

        for (Tutor tutor : tutors) {
            List<ModulePreference> prefs = modulePreferenceRepository.findByTutor(tutor);

            if (prefs.size() < 2) continue;

            // Sort by compatibility score
            prefs.sort((p1, p2) -> p2.getCompatibilityScore()
                .compareTo(p1.getCompatibilityScore()));

            // Check if assigned module is not the best match
            ModulePreference assigned = prefs.stream()
                .filter(p -> "ASSIGNED".equals(p.getAssignmentStatus()))
                .findFirst()
                .orElse(null);

            if (assigned != null) {
                ModulePreference bestMatch = prefs.get(0);

                if (!assigned.getId().equals(bestMatch.getId())) {
                    BigDecimal diff = bestMatch.getCompatibilityScore()
                        .subtract(assigned.getCompatibilityScore());

                    if (diff.compareTo(BigDecimal.valueOf(10)) > 0) {
                        Map<String, Object> deadlock = new HashMap<>();
                        deadlock.put("type", "PREFERENCE_DEADLOCK");
                        deadlock.put("tutorId", tutor.getId());
                        deadlock.put("tutorEmail", tutor.getUser().getEmail());
                        deadlock.put("assignedModule", assigned.getModule().getName());
                        deadlock.put("assignedScore", assigned.getCompatibilityScore());
                        deadlock.put("bestMatchModule", bestMatch.getModule().getName());
                        deadlock.put("bestMatchScore", bestMatch.getCompatibilityScore());
                        deadlock.put("scoreDifference", diff);
                        deadlock.put("recommendation", 
                            "Consider reassigning to: " + bestMatch.getModule().getName());
                        deadlock.put("detectedAt", LocalDateTime.now());

                        preferenceDeadlocks.add(deadlock);
                    }
                }
            }
        }

        return preferenceDeadlocks;
    }

    /**
     * DEADLOCK TYPE 3: Capacity Deadlock
     * More qualified tutors than available slots for a module
     */
    private List<Map<String, Object>> detectCapacityDeadlocks() {
        List<Map<String, Object>> capacityDeadlocks = new ArrayList<>();

        List<PAMAModule> modules = pamaModuleRepository.findAll();

        for (PAMAModule module : modules) {
            int maxSlots = module.getMaxTutorsNeeded();
            int currentAssigned = module.getCurrentTutorsAssigned() != null ? 
                module.getCurrentTutorsAssigned() : 0;

            List<ModulePreference> allQualified = modulePreferenceRepository.findByModule(module)
                .stream()
                .filter(p -> p.getCompatibilityScore().compareTo(BigDecimal.valueOf(70)) >= 0)
                .collect(Collectors.toList());

            if (allQualified.size() > maxSlots) {
                Map<String, Object> deadlock = new HashMap<>();
                deadlock.put("type", "CAPACITY_DEADLOCK");
                deadlock.put("moduleId", module.getId());
                deadlock.put("moduleName", module.getName());
                deadlock.put("maxSlots", maxSlots);
                deadlock.put("currentAssigned", currentAssigned);
                deadlock.put("qualifiedTutors", allQualified.size());
                deadlock.put("surplus", allQualified.size() - maxSlots);
                deadlock.put("qualifiedTutorsList", allQualified.stream()
                    .map(p -> new HashMap<String, Object>() {{
                        put("tutorEmail", p.getTutor().getUser().getEmail());
                        put("score", p.getCompatibilityScore());
                    }})
                    .collect(Collectors.toList()));
                deadlock.put("recommendation", 
                    "Consider expanding slots or creating similar module");
                deadlock.put("detectedAt", LocalDateTime.now());

                capacityDeadlocks.add(deadlock);
            }
        }

        return capacityDeadlocks;
    }

    /**
     * DEADLOCK TYPE 4: Conflict Deadlock
     * Two tutors with similar scores competing for same slot
     * One is assigned, other is pending with close score
     */
    private List<Map<String, Object>> detectConflictDeadlocks() {
        List<Map<String, Object>> conflictDeadlocks = new ArrayList<>();
        final BigDecimal THRESHOLD = BigDecimal.valueOf(3);

        List<PAMAModule> modules = pamaModuleRepository.findAll();

        for (PAMAModule module : modules) {
            List<ModulePreference> prefs = modulePreferenceRepository.findByModule(module)
                .stream()
                .sorted((p1, p2) -> p2.getCompatibilityScore()
                    .compareTo(p1.getCompatibilityScore()))
                .collect(Collectors.toList());

            // Check consecutive tutors with similar scores
            for (int i = 0; i < prefs.size() - 1; i++) {
                ModulePreference current = prefs.get(i);
                ModulePreference next = prefs.get(i + 1);

                BigDecimal diff = current.getCompatibilityScore()
                    .subtract(next.getCompatibilityScore())
                    .abs();

                if (diff.compareTo(THRESHOLD) < 0) {
                    String currentStatus = current.getAssignmentStatus();
                    String nextStatus = next.getAssignmentStatus();

                    if ((!currentStatus.equals(nextStatus)) ||
                        ("PENDING".equals(currentStatus) && "PENDING".equals(nextStatus))) {
                        
                        Map<String, Object> deadlock = new HashMap<>();
                        deadlock.put("type", "CONFLICT_DEADLOCK");
                        deadlock.put("moduleId", module.getId());
                        deadlock.put("moduleName", module.getName());
                        deadlock.put("tutor1", current.getTutor().getUser().getEmail());
                        deadlock.put("tutor1Score", current.getCompatibilityScore());
                        deadlock.put("tutor1Status", currentStatus);
                        deadlock.put("tutor2", next.getTutor().getUser().getEmail());
                        deadlock.put("tutor2Score", next.getCompatibilityScore());
                        deadlock.put("tutor2Status", nextStatus);
                        deadlock.put("scoreDifference", diff);
                        deadlock.put("recommendation", 
                            "Manual review recommended for tie-breaking");
                        deadlock.put("detectedAt", LocalDateTime.now());

                        conflictDeadlocks.add(deadlock);
                    }
                }
            }
        }

        return conflictDeadlocks;
    }

    /**
     * Calculate deadlock severity
     * 0-3: LOW, 3-5: MEDIUM, 5+: HIGH
     */
    private String calculateSeverity(BigDecimal difference) {
        if (difference.compareTo(BigDecimal.valueOf(3)) < 0) {
            return "HIGH";
        } else if (difference.compareTo(BigDecimal.valueOf(5)) < 0) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    /**
     * Count critical deadlocks (severity HIGH)
     */
    public int countCriticalDeadlocks() {
        Map<String, Object> allDeadlocks = detectAllDeadlocks();
        
        int critical = 0;
        critical += ((List<?>) allDeadlocks.get("scoreDeadlocks")).stream()
            .filter(d -> "HIGH".equals(((Map<?, ?>) d).get("severity")))
            .count();

        return critical;
    }
}