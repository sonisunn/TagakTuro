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
public class PAMAMatchingService {

    @Autowired
    private PAMAModuleRepository pamaModuleRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private ModulePreferenceRepository modulePreferenceRepository;

    @Autowired
    private TutorScoringService tutorScoringService;

    /**
     * PAMA Algorithm: Preference-based Assignment with Maximal matching
     * 
     * Algorithm Steps:
     * 1. Calculate compatibility scores between tutors and modules
     * 2. Apply stable matching using weighted preferences
     * 3. Assign tutors to modules based on preferences and scores
     * 4. Mark unmatched as PENDING for manual intervention
     */
    public Map<String, Object> runPAMAMatching(List<Long> moduleIds, List<Long> tutorIds) {
        Map<String, Object> result = new HashMap<>();
        List<ModulePreference> assignments = new ArrayList<>();
        List<String> pendingAssignments = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try {
            // Step 1: Get all modules and tutors
            List<PAMAModule> modules = moduleIds.isEmpty() 
                ? pamaModuleRepository.findAll() 
                : pamaModuleRepository.findAllById(moduleIds);
            
            List<Tutor> tutors = tutorIds.isEmpty() 
                ? tutorRepository.findAll() 
                : tutorRepository.findAllById(tutorIds);

            if (modules.isEmpty() || tutors.isEmpty()) {
                result.put("error", "No modules or tutors found");
                return result;
            }

            // Step 2: Calculate compatibility scores for all tutor-module pairs
            for (PAMAModule module : modules) {
                if ("CLOSED".equals(module.getStatus())) {
                    continue;  // Skip closed modules
                }

                List<ModulePreference> compatibleTutors = new ArrayList<>();

                for (Tutor tutor : tutors) {
                    BigDecimal compatScore = calculateCompatibilityScore(tutor, module);
                    
                    ModulePreference pref = modulePreferenceRepository
                        .findByTutorAndModule(tutor, module)
                        .orElse(new ModulePreference(tutor, module));

                    pref.setCompatibilityScore(compatScore);
                    pref.setIsInterested(true);

                    if (compatScore.compareTo(BigDecimal.valueOf(50)) >= 0) {
                        compatibleTutors.add(pref);
                    }
                }

                // Step 3: Sort by compatibility score (descending)
                compatibleTutors.sort((p1, p2) -> 
                    p2.getCompatibilityScore().compareTo(p1.getCompatibilityScore())
                );

                // Step 4: Assign tutors to module (up to maxTutorsNeeded)
                int tutorsToAssign = module.getMaxTutorsNeeded() - 
                    (module.getCurrentTutorsAssigned() != null ? module.getCurrentTutorsAssigned() : 0);

                for (int i = 0; i < Math.min(tutorsToAssign, compatibleTutors.size()); i++) {
                    ModulePreference pref = compatibleTutors.get(i);
                    pref.setAssigned(true);
                    pref.setAssignmentStatus("ASSIGNED");
                    pref.setPreferenceRank(i + 1);
                    pref.setUpdatedAt(LocalDateTime.now());
                    
                    ModulePreference saved = modulePreferenceRepository.save(pref);
                    assignments.add(saved);

                    // Update module
                    module.setCurrentTutorsAssigned(
                        (module.getCurrentTutorsAssigned() != null ? module.getCurrentTutorsAssigned() : 0) + 1
                    );
                }

                // Step 5: Mark remaining as PENDING if slots still available
                if (module.getCurrentTutorsAssigned() < module.getMaxTutorsNeeded()) {
                    for (int i = tutorsToAssign; i < compatibleTutors.size(); i++) {
                        ModulePreference pref = compatibleTutors.get(i);
                        pref.setAssignmentStatus("PENDING");
                        pref.setUpdatedAt(LocalDateTime.now());
                        modulePreferenceRepository.save(pref);
                        pendingAssignments.add(
                            "Module: " + module.getName() + " | Tutor: " + pref.getTutor().getUser().getEmail()
                        );
                    }
                }

                // Update module status
                if (module.getCurrentTutorsAssigned() >= module.getMaxTutorsNeeded()) {
                    module.setStatus("FILLED");
                }
                module.setUpdatedAt(LocalDateTime.now());
                pamaModuleRepository.save(module);
            }

            result.put("success", true);
            result.put("assignmentsCount", assignments.size());
            result.put("assignments", assignments);
            result.put("pendingCount", pendingAssignments.size());
            result.put("pending", pendingAssignments);

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            errors.add(e.getMessage());
            result.put("errors", errors);
        }

        return result;
    }

    /**
     * Enhanced PAMA matching with weighted scores integrated
     * This is called from HybridAssignmentService
     */
    public Map<String, Object> runPAMAMatchingWithWeightedScores(
            List<Long> moduleIds, List<Long> tutorIds) {
        
        Map<String, Object> result = new HashMap<>();
        List<ModulePreference> assignments = new ArrayList<>();
        List<String> pendingAssignments = new ArrayList<>();

        try {
            List<PAMAModule> modules = moduleIds.isEmpty() 
                ? pamaModuleRepository.findAll() 
                : pamaModuleRepository.findAllById(moduleIds);
            
            List<Tutor> tutors = tutorIds.isEmpty() 
                ? tutorRepository.findAll() 
                : tutorRepository.findAllById(tutorIds);

            if (modules.isEmpty() || tutors.isEmpty()) {
                result.put("error", "No modules or tutors found");
                return result;
            }

            // Process each module
            for (PAMAModule module : modules) {
                if ("CLOSED".equals(module.getStatus())) {
                    continue;
                }

                List<ModulePreference> compatibleTutors = new ArrayList<>();

                // Calculate SCORE-WEIGHTED compatibility
                for (Tutor tutor : tutors) {
                    BigDecimal compatScore = 
                        calculateScoreWeightedCompatibility(tutor, module);
                    
                    ModulePreference pref = modulePreferenceRepository
                        .findByTutorAndModule(tutor, module)
                        .orElse(new ModulePreference(tutor, module));

                    pref.setCompatibilityScore(compatScore);
                    pref.setIsInterested(true);

                    if (compatScore.compareTo(BigDecimal.valueOf(50)) >= 0) {
                        compatibleTutors.add(pref);
                    }
                }

                // Sort by score-weighted compatibility
                compatibleTutors.sort((p1, p2) -> 
                    p2.getCompatibilityScore().compareTo(p1.getCompatibilityScore())
                );

                // Assign tutors
                int tutorsToAssign = module.getMaxTutorsNeeded() - 
                    (module.getCurrentTutorsAssigned() != null ? 
                        module.getCurrentTutorsAssigned() : 0);

                for (int i = 0; i < Math.min(tutorsToAssign, compatibleTutors.size()); i++) {
                    ModulePreference pref = compatibleTutors.get(i);
                    pref.setAssigned(true);
                    pref.setAssignmentStatus("ASSIGNED");
                    pref.setPreferenceRank(i + 1);
                    pref.setUpdatedAt(LocalDateTime.now());
                    
                    ModulePreference saved = modulePreferenceRepository.save(pref);
                    assignments.add(saved);

                    module.setCurrentTutorsAssigned(
                        (module.getCurrentTutorsAssigned() != null ? 
                            module.getCurrentTutorsAssigned() : 0) + 1
                    );
                }

                // Mark remaining as PENDING
                if (module.getCurrentTutorsAssigned() < module.getMaxTutorsNeeded()) {
                    for (int i = tutorsToAssign; i < compatibleTutors.size(); i++) {
                        ModulePreference pref = compatibleTutors.get(i);
                        pref.setAssignmentStatus("PENDING");
                        pref.setUpdatedAt(LocalDateTime.now());
                        modulePreferenceRepository.save(pref);
                        pendingAssignments.add(
                            "Module: " + module.getName() + " | Tutor: " + 
                            pref.getTutor().getUser().getEmail() + 
                            " (Score: " + pref.getCompatibilityScore() + ")"
                        );
                    }
                }

                if (module.getCurrentTutorsAssigned() >= module.getMaxTutorsNeeded()) {
                    module.setStatus("FILLED");
                }
                module.setUpdatedAt(LocalDateTime.now());
                pamaModuleRepository.save(module);
            }

            result.put("success", true);
            result.put("assignmentsCount", assignments.size());
            result.put("assignments", assignments);
            result.put("pendingCount", pendingAssignments.size());
            result.put("pending", pendingAssignments);

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Calculate compatibility score between a tutor and a module
     * Factors:
     * - Tutor weighted score (40%)
     * - Specialization match (30%)
     * - Experience match (20%)
     * - Qualification match (10%)
     */
    private BigDecimal calculateCompatibilityScore(Tutor tutor, PAMAModule module) {
        BigDecimal score = BigDecimal.ZERO;

        try {
            // Factor 1: Tutor weighted score (40%)
            TutorScore tutorScore = tutorScoringService.getScore(tutor.getId());
            BigDecimal weightedScoreFactor = tutorScore.getWeightedScore()
                .multiply(BigDecimal.valueOf(0.40));

            // Factor 2: Specialization match (30%)
            BigDecimal specializationFactor = BigDecimal.ZERO;
            if (tutor.getSpecialization() != null && module.getSubject() != null) {
                if (tutor.getSpecialization().equalsIgnoreCase(module.getSubject())) {
                    specializationFactor = BigDecimal.valueOf(100 * 0.30);
                } else if (isRelatedSubject(tutor.getSpecialization(), module.getSubject())) {
                    specializationFactor = BigDecimal.valueOf(75 * 0.30);
                } else {
                    specializationFactor = BigDecimal.valueOf(40 * 0.30);
                }
            }

            // Factor 3: Experience match (20%)
            BigDecimal experienceFactor = BigDecimal.ZERO;
            if (module.getMinExperienceYears() != null && tutor.getYearsOfExperience() != null) {
                if (tutor.getYearsOfExperience() >= module.getMinExperienceYears()) {
                    experienceFactor = BigDecimal.valueOf(100 * 0.20);
                } else {
                    int gap = module.getMinExperienceYears() - tutor.getYearsOfExperience();
                    double expScore = Math.max(0, 100 - (gap * 10));
                    experienceFactor = BigDecimal.valueOf(expScore * 0.20);
                }
            }

            // Factor 4: Qualification match (10%)
            BigDecimal qualificationFactor = BigDecimal.ZERO;
            if (module.getRequiredQualification() != null && tutor.getQualification() != null) {
                if (tutor.getQualification().contains(module.getRequiredQualification())) {
                    qualificationFactor = BigDecimal.valueOf(100 * 0.10);
                } else {
                    qualificationFactor = BigDecimal.valueOf(50 * 0.10);
                }
            }

            score = weightedScoreFactor
                .add(specializationFactor)
                .add(experienceFactor)
                .add(qualificationFactor);

        } catch (Exception e) {
            score = BigDecimal.valueOf(50);  // Default middle score on error
        }

        return score.setScale(2, RoundingMode.HALF_UP)
            .min(BigDecimal.valueOf(100))
            .max(BigDecimal.ZERO);
    }

    /**
     * Calculate SCORE-WEIGHTED compatibility (NEW - for fusion)
     * Formula:
     * (Tutor Weighted Score * 40%) + 
     * (Specialization Match * 30%) + 
     * (Experience Match * 20%) + 
     * (Qualification Match * 10%)
     */
    private BigDecimal calculateScoreWeightedCompatibility(
            Tutor tutor, PAMAModule module) {
        
        BigDecimal score = BigDecimal.ZERO;

        try {
            // Factor 1: Tutor weighted score (40%) - PRIMARY FACTOR
            TutorScore tutorScore = tutorScoringService.getScore(tutor.getId());
            BigDecimal weightedScoreFactor = tutorScore.getWeightedScore()
                .multiply(BigDecimal.valueOf(0.40));

            // Factor 2: Specialization match (30%)
            BigDecimal specializationFactor = BigDecimal.ZERO;
            if (tutor.getSpecialization() != null && module.getSubject() != null) {
                if (tutor.getSpecialization().equalsIgnoreCase(module.getSubject())) {
                    specializationFactor = BigDecimal.valueOf(100 * 0.30);
                } else if (isRelatedSubject(tutor.getSpecialization(), module.getSubject())) {
                    specializationFactor = BigDecimal.valueOf(75 * 0.30);
                } else {
                    specializationFactor = BigDecimal.valueOf(40 * 0.30);
                }
            }

            // Factor 3: Experience match (20%)
            BigDecimal experienceFactor = BigDecimal.ZERO;
            if (module.getMinExperienceYears() != null && tutor.getYearsOfExperience() != null) {
                if (tutor.getYearsOfExperience() >= module.getMinExperienceYears()) {
                    experienceFactor = BigDecimal.valueOf(100 * 0.20);
                } else {
                    int gap = module.getMinExperienceYears() - tutor.getYearsOfExperience();
                    double expScore = Math.max(0, 100 - (gap * 10));
                    experienceFactor = BigDecimal.valueOf(expScore * 0.20);
                }
            }

            // Factor 4: Qualification match (10%)
            BigDecimal qualificationFactor = BigDecimal.ZERO;
            if (module.getRequiredQualification() != null && tutor.getQualification() != null) {
                if (tutor.getQualification().contains(module.getRequiredQualification())) {
                    qualificationFactor = BigDecimal.valueOf(100 * 0.10);
                } else {
                    qualificationFactor = BigDecimal.valueOf(50 * 0.10);
                }
            }

            score = weightedScoreFactor
                .add(specializationFactor)
                .add(experienceFactor)
                .add(qualificationFactor);

        } catch (Exception e) {
            score = BigDecimal.valueOf(50);
        }

        return score.setScale(2, RoundingMode.HALF_UP)
            .min(BigDecimal.valueOf(100))
            .max(BigDecimal.ZERO);
    }

    /**
     * Check if two subjects are related
     */
    private boolean isRelatedSubject(String spec1, String spec2) {
        // Simple heuristic: check for common keywords
        String s1 = spec1.toLowerCase();
        String s2 = spec2.toLowerCase();
        
        return (s1.contains("math") && s2.contains("math")) ||
               (s1.contains("science") && s2.contains("science")) ||
               (s1.contains("english") && s2.contains("english")) ||
               (s1.contains("lang") && s2.contains("lang"));
    }

    /**
     * Get assignment status for a module
     */
    public List<ModulePreference> getModuleAssignments(Long moduleId) {
        PAMAModule module = pamaModuleRepository.findById(moduleId)
            .orElseThrow(() -> new IllegalArgumentException("Module not found"));
        
        return modulePreferenceRepository.findByModule(module);
    }

    /**
     * Get pending assignments
     */
    public List<ModulePreference> getPendingAssignments() {
        return modulePreferenceRepository.findByAssignmentStatus("PENDING");
    }

    /**
     * Get assignments for a specific tutor
     */
    public List<ModulePreference> getTutorAssignments(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new IllegalArgumentException("Tutor not found"));
        
        return modulePreferenceRepository.findByTutor(tutor);
    }
}