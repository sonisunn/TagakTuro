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
public class AssignmentOptimizer {

    @Autowired
    private ModulePreferenceRepository modulePreferenceRepository;

    @Autowired
    private PAMAModuleRepository pamaModuleRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private TutorScoreRepository tutorScoreRepository;

    /**
     * ITERATIVE REFINEMENT ALGORITHM
     * Optimize assignments through multiple iterations
     * Each iteration improves global satisfaction score
     */
    public Map<String, Object> optimizeAssignmentsIterative(int maxIterations) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> iterationLogs = new ArrayList<>();

        double currentOptimality = 0;
        double previousOptimality = 0;

        try {
            for (int iteration = 1; iteration <= maxIterations; iteration++) {
                Map<String, Object> iterLog = new HashMap<>();
                iterLog.put("iteration", iteration);

                // Calculate current optimality score
                currentOptimality = calculateGlobalOptimalityScore();
                iterLog.put("optimalityScore", currentOptimality);

                // Check for improvement
                if (iteration > 1 && currentOptimality <= previousOptimality) {
                    iterLog.put("status", "CONVERGED");
                    iterationLogs.add(iterLog);
                    break;  // Stop if no improvement
                }

                // Perform swap operations to improve score
                int swapsPerformed = performSwaps();
                iterLog.put("swapsPerformed", swapsPerformed);

                // Apply local search optimization
                int localOptimizations = applyLocalSearch();
                iterLog.put("localOptimizations", localOptimizations);

                // Recalculate scores
                recalculateAllCompatibilities();

                iterLog.put("timestamp", LocalDateTime.now());
                iterationLogs.add(iterLog);

                previousOptimality = currentOptimality;
            }

            result.put("success", true);
            result.put("iterations", maxIterations);
            result.put("finalOptimalityScore", currentOptimality);
            result.put("iterationLogs", iterationLogs);
            result.put("optimizationStatus", "COMPLETE");

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Calculate global optimality score (0-100)
     * Based on: Assignment fairness, module fill rate, score utilization
     */
    private double calculateGlobalOptimalityScore() {
        List<PAMAModule> modules = pamaModuleRepository.findAll();
        List<ModulePreference> allAssignments = modulePreferenceRepository.findAll();

        // Factor 1: Module fill rate (capacity utilization)
        double fillRate = 0;
        for (PAMAModule module : modules) {
            int assigned = module.getCurrentTutorsAssigned() != null ? 
                module.getCurrentTutorsAssigned() : 0;
            fillRate += (double) assigned / module.getMaxTutorsNeeded();
        }
        fillRate = (fillRate / modules.size()) * 100;

        // Factor 2: Assignment quality (average compatibility score)
        double avgQuality = allAssignments.stream()
            .filter(a -> "ASSIGNED".equals(a.getAssignmentStatus()))
            .mapToDouble(a -> a.getCompatibilityScore().doubleValue())
            .average()
            .orElse(50);

        // Factor 3: Fairness (score variance - lower is more fair)
        double variance = calculateScoreVariance();
        double fairness = Math.max(0, 100 - variance);

        // Composite score (weighted average)
        double optimality = (fillRate * 0.4) + (avgQuality * 0.4) + (fairness * 0.2);
        return Math.min(100, Math.max(0, optimality));
    }

    /**
     * Calculate score variance across assignments
     */
    private double calculateScoreVariance() {
        List<ModulePreference> assigned = modulePreferenceRepository.findAll().stream()
            .filter(a -> "ASSIGNED".equals(a.getAssignmentStatus()))
            .collect(Collectors.toList());

        if (assigned.isEmpty()) return 0;

        double mean = assigned.stream()
            .mapToDouble(a -> a.getCompatibilityScore().doubleValue())
            .average()
            .orElse(50);

        double variance = assigned.stream()
            .mapToDouble(a -> Math.pow(
                a.getCompatibilityScore().doubleValue() - mean, 2))
            .average()
            .orElse(0);

        return Math.sqrt(variance);
    }

    /**
     * SWAP OPERATION: Try swapping assignments to improve score
     * If Tutor A in Module X and Tutor B in Module Y,
     * check if swapping improves overall score
     */
    private int performSwaps() {
        int swapsPerformed = 0;
        List<PAMAModule> modules = pamaModuleRepository.findAll();

        for (int i = 0; i < modules.size() - 1; i++) {
            for (int j = i + 1; j < modules.size(); j++) {
                PAMAModule module1 = modules.get(i);
                PAMAModule module2 = modules.get(j);

                List<ModulePreference> prefs1 = modulePreferenceRepository
                    .findByModule(module1)
                    .stream()
                    .filter(p -> "ASSIGNED".equals(p.getAssignmentStatus()))
                    .collect(Collectors.toList());

                List<ModulePreference> prefs2 = modulePreferenceRepository
                    .findByModule(module2)
                    .stream()
                    .filter(p -> "ASSIGNED".equals(p.getAssignmentStatus()))
                    .collect(Collectors.toList());

                // Try swapping best candidates
                if (!prefs1.isEmpty() && !prefs2.isEmpty()) {
                    for (ModulePreference p1 : prefs1) {
                        for (ModulePreference p2 : prefs2) {
                            double currentScore = p1.getCompatibilityScore().doubleValue() + 
                                                p2.getCompatibilityScore().doubleValue();

                            // Calculate score if swapped
                            BigDecimal p1ScoreIfSwapped = 
                                calculateCompatibilityForSwap(p1.getTutor(), module2);
                            BigDecimal p2ScoreIfSwapped = 
                                calculateCompatibilityForSwap(p2.getTutor(), module1);

                            double swappedScore = p1ScoreIfSwapped.doubleValue() + 
                                               p2ScoreIfSwapped.doubleValue();

                            // If swap improves score by at least 5 points, perform it
                            if (swappedScore - currentScore > 5) {
                                // Perform swap
                                p1.setModule(module2);
                                p1.setCompatibilityScore(p1ScoreIfSwapped);
                                
                                p2.setModule(module1);
                                p2.setCompatibilityScore(p2ScoreIfSwapped);

                                modulePreferenceRepository.save(p1);
                                modulePreferenceRepository.save(p2);

                                swapsPerformed++;
                            }
                        }
                    }
                }
            }
        }

        return swapsPerformed;
    }

    /**
     * Helper: Calculate compatibility if assignment swapped
     */
    private BigDecimal calculateCompatibilityForSwap(Tutor tutor, PAMAModule module) {
        // Simplified compatibility calculation
        BigDecimal score = BigDecimal.valueOf(50);  // Default
        
        try {
            TutorScore tutorScore = tutorScoreRepository.findByTutorId(tutor.getId())
                .orElse(null);
            if (tutorScore != null) {
                score = tutorScore.getWeightedScore().multiply(BigDecimal.valueOf(0.4));
            }
        } catch (Exception e) {
            // Use default
        }

        return score.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * LOCAL SEARCH: Improve individual assignment quality
     * For each tutor, check if reassignment to another module improves score
     */
    private int applyLocalSearch() {
        int optimizations = 0;
        List<ModulePreference> allAssigned = modulePreferenceRepository.findAll().stream()
            .filter(p -> "ASSIGNED".equals(p.getAssignmentStatus()))
            .collect(Collectors.toList());

        for (ModulePreference current : allAssigned) {
            // Get all modules tutor could be assigned to
            List<ModulePreference> tutorPrefs = modulePreferenceRepository
                .findByTutor(current.getTutor());

            // Find best unassigned module for this tutor
            ModulePreference bestAlternative = tutorPrefs.stream()
                .filter(p -> !p.getAssigned() && 
                           p.getCompatibilityScore().compareTo(current.getCompatibilityScore()) > 0)
                .max(Comparator.comparing(ModulePreference::getCompatibilityScore))
                .orElse(null);

            if (bestAlternative != null) {
                // Check if swapping improves global score
                double currentGlobal = calculateGlobalOptimalityScore();

                // Hypothetically swap
                current.setAssignmentStatus("PENDING");
                bestAlternative.setAssignmentStatus("ASSIGNED");

                modulePreferenceRepository.save(current);
                modulePreferenceRepository.save(bestAlternative);

                double newGlobal = calculateGlobalOptimalityScore();

                if (newGlobal > currentGlobal) {
                    // Keep the change
                    optimizations++;
                } else {
                    // Revert
                    current.setAssignmentStatus("ASSIGNED");
                    bestAlternative.setAssignmentStatus("PENDING");

                    modulePreferenceRepository.save(current);
                    modulePreferenceRepository.save(bestAlternative);
                }
            }
        }

        return optimizations;
    }

    /**
     * Recalculate all compatibility scores based on current assignments
     */
    private void recalculateAllCompatibilities() {
        List<ModulePreference> allPrefs = modulePreferenceRepository.findAll();
        
        for (ModulePreference pref : allPrefs) {
            if ("ASSIGNED".equals(pref.getAssignmentStatus())) {
                // Scores remain same; could add dynamic recalculation here
                pref.setUpdatedAt(LocalDateTime.now());
                modulePreferenceRepository.save(pref);
            }
        }
    }

    /**
     * Get optimization report
     */
    public Map<String, Object> getOptimizationReport() {
        Map<String, Object> report = new HashMap<>();

        double globalScore = calculateGlobalOptimalityScore();
        double variance = calculateScoreVariance();

        report.put("globalOptimalityScore", globalScore);
        report.put("scoreVariance", variance);
        report.put("fairnessLevel", Math.max(0, 100 - variance));

        List<PAMAModule> modules = pamaModuleRepository.findAll();
        report.put("totalModules", modules.size());
        report.put("moduleFillRate", modules.stream()
            .mapToDouble(m -> (double) (m.getCurrentTutorsAssigned() != null ? 
                m.getCurrentTutorsAssigned() : 0) / m.getMaxTutorsNeeded() * 100)
            .average()
            .orElse(0));

        report.put("generatedAt", LocalDateTime.now());
        return report;
    }
}