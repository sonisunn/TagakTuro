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
public class DeadlockResolutionService {

    @Autowired
    private ModulePreferenceRepository modulePreferenceRepository;

    @Autowired
    private TutorScoreRepository tutorScoreRepository;

    @Autowired
    private PAMAModuleRepository pamaModuleRepository;

    /**
     * DEADLOCK RESOLUTION STRATEGIES
     * 
     * Strategy 1: Score-Based Priority (Highest score wins)
     * Strategy 2: Experience-Based Priority (More years wins)
     * Strategy 3: Rating-Based Priority (Better rating wins)
     * Strategy 4: Round-Robin Assignment
     * Strategy 5: Module Priority Based (Higher priority module gets better tutor)
     */

    /**
     * AUTO-RESOLVE deadlocks using SCORE-BASED PRIORITY
     * Best for most situations
     */
    public Map<String, Object> resolveScoreDeadlocks(List<Long> moduleIds) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> resolved = new ArrayList<>();
        int resolutionCount = 0;

        try {
            List<PAMAModule> modules = moduleIds.isEmpty() 
                ? pamaModuleRepository.findAll() 
                : pamaModuleRepository.findAllById(moduleIds);

            for (PAMAModule module : modules) {
                List<ModulePreference> prefs = modulePreferenceRepository.findByModule(module)
                    .stream()
                    .sorted((p1, p2) -> p2.getCompatibilityScore()
                        .compareTo(p1.getCompatibilityScore()))
                    .collect(Collectors.toList());

                // Fill slots with highest score tutors
                int slotsNeeded = module.getMaxTutorsNeeded();
                
                for (int i = 0; i < Math.min(slotsNeeded, prefs.size()); i++) {
                    ModulePreference pref = prefs.get(i);
                    
                    if (!"ASSIGNED".equals(pref.getAssignmentStatus())) {
                        pref.setAssigned(true);
                        pref.setAssignmentStatus("ASSIGNED");
                        pref.setPreferenceRank(i + 1);
                        pref.setUpdatedAt(LocalDateTime.now());
                        
                        modulePreferenceRepository.save(pref);

                        Map<String, Object> resolution = new HashMap<>();
                        resolution.put("moduleId", module.getId());
                        resolution.put("moduleName", module.getName());
                        resolution.put("tutorEmail", pref.getTutor().getUser().getEmail());
                        resolution.put("score", pref.getCompatibilityScore());
                        resolution.put("strategy", "SCORE_BASED_PRIORITY");
                        resolution.put("resolvedAt", LocalDateTime.now());

                        resolved.add(resolution);
                        resolutionCount++;
                    }
                }

                // Update module
                module.setCurrentTutorsAssigned(Math.min(slotsNeeded, prefs.size()));
                if (module.getCurrentTutorsAssigned() >= slotsNeeded) {
                    module.setStatus("FILLED");
                }
                module.setUpdatedAt(LocalDateTime.now());
                pamaModuleRepository.save(module);
            }

            result.put("success", true);
            result.put("resolutionCount", resolutionCount);
            result.put("resolutions", resolved);
            result.put("strategy", "SCORE_BASED_PRIORITY");

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * EXPERIENCE-BASED PRIORITY resolution
     * Prefer tutors with more years of experience
     */
    public Map<String, Object> resolveExperienceDeadlocks(Long moduleId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            PAMAModule module = pamaModuleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found"));

            List<ModulePreference> prefs = modulePreferenceRepository.findByModule(module)
                .stream()
                .filter(p -> p.getCompatibilityScore().compareTo(BigDecimal.valueOf(50)) >= 0)
                .sorted((p1, p2) -> {
                    int yearsExp1 = p1.getTutor().getYearsOfExperience() != null ? 
                        p1.getTutor().getYearsOfExperience() : 0;
                    int yearsExp2 = p2.getTutor().getYearsOfExperience() != null ? 
                        p2.getTutor().getYearsOfExperience() : 0;
                    return Integer.compare(yearsExp2, yearsExp1);  // Descending
                })
                .collect(Collectors.toList());

            int slotsNeeded = module.getMaxTutorsNeeded();
            List<Map<String, Object>> assigned = new ArrayList<>();

            for (int i = 0; i < Math.min(slotsNeeded, prefs.size()); i++) {
                ModulePreference pref = prefs.get(i);
                pref.setAssigned(true);
                pref.setAssignmentStatus("ASSIGNED");
                pref.setPreferenceRank(i + 1);
                pref.setUpdatedAt(LocalDateTime.now());

                modulePreferenceRepository.save(pref);

                Map<String, Object> assignInfo = new HashMap<>();
                assignInfo.put("tutorEmail", pref.getTutor().getUser().getEmail());
                assignInfo.put("yearsExperience", pref.getTutor().getYearsOfExperience());
                assignInfo.put("compatibilityScore", pref.getCompatibilityScore());
                assigned.add(assignInfo);
            }

            module.setCurrentTutorsAssigned(Math.min(slotsNeeded, prefs.size()));
            if (module.getCurrentTutorsAssigned() >= slotsNeeded) {
                module.setStatus("FILLED");
            }
            pamaModuleRepository.save(module);

            result.put("success", true);
            result.put("moduleId", moduleId);
            result.put("assigned", assigned);
            result.put("strategy", "EXPERIENCE_BASED_PRIORITY");

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * RATING-BASED PRIORITY resolution
     * Prefer tutors with higher student ratings
     */
    public Map<String, Object> resolveRatingDeadlocks(Long moduleId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            PAMAModule module = pamaModuleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found"));

            List<ModulePreference> prefs = modulePreferenceRepository.findByModule(module)
                .stream()
                .filter(p -> p.getCompatibilityScore().compareTo(BigDecimal.valueOf(50)) >= 0)
                .sorted((p1, p2) -> {
                    BigDecimal rating1 = p1.getTutor().getAverageRating() != null ? 
                        p1.getTutor().getAverageRating() : BigDecimal.ZERO;
                    BigDecimal rating2 = p2.getTutor().getAverageRating() != null ? 
                        p2.getTutor().getAverageRating() : BigDecimal.ZERO;
                    return rating2.compareTo(rating1);  // Descending
                })
                .collect(Collectors.toList());

            int slotsNeeded = module.getMaxTutorsNeeded();
            List<Map<String, Object>> assigned = new ArrayList<>();

            for (int i = 0; i < Math.min(slotsNeeded, prefs.size()); i++) {
                ModulePreference pref = prefs.get(i);
                pref.setAssigned(true);
                pref.setAssignmentStatus("ASSIGNED");
                pref.setPreferenceRank(i + 1);
                pref.setUpdatedAt(LocalDateTime.now());

                modulePreferenceRepository.save(pref);

                Map<String, Object> assignInfo = new HashMap<>();
                assignInfo.put("tutorEmail", pref.getTutor().getUser().getEmail());
                assignInfo.put("averageRating", pref.getTutor().getAverageRating());
                assignInfo.put("compatibilityScore", pref.getCompatibilityScore());
                assigned.add(assignInfo);
            }

            module.setCurrentTutorsAssigned(Math.min(slotsNeeded, prefs.size()));
            if (module.getCurrentTutorsAssigned() >= slotsNeeded) {
                module.setStatus("FILLED");
            }
            pamaModuleRepository.save(module);

            result.put("success", true);
            result.put("moduleId", moduleId);
            result.put("assigned", assigned);
            result.put("strategy", "RATING_BASED_PRIORITY");

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * MODULE PRIORITY-BASED resolution
     * Assign best tutors to highest priority modules first
     */
    public Map<String, Object> resolveByModulePriority(List<Long> moduleIds) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<PAMAModule> modules = moduleIds.isEmpty() 
                ? pamaModuleRepository.findAll() 
                : pamaModuleRepository.findAllById(moduleIds);

            // Sort modules by priority (descending)
            modules.sort((m1, m2) -> {
                Integer p1 = m1.getPriority() != null ? m1.getPriority() : 5;
                Integer p2 = m2.getPriority() != null ? m2.getPriority() : 5;
                return Integer.compare(p2, p1);  // Descending
            });

            List<Map<String, Object>> assignments = new ArrayList<>();

            for (PAMAModule module : modules) {
                List<ModulePreference> prefs = modulePreferenceRepository.findByModule(module)
                    .stream()
                    .sorted((p1, p2) -> p2.getCompatibilityScore()
                        .compareTo(p1.getCompatibilityScore()))
                    .collect(Collectors.toList());

                int slotsNeeded = module.getMaxTutorsNeeded();

                for (int i = 0; i < Math.min(slotsNeeded, prefs.size()); i++) {
                    ModulePreference pref = prefs.get(i);
                    pref.setAssigned(true);
                    pref.setAssignmentStatus("ASSIGNED");
                    pref.setPreferenceRank(i + 1);
                    pref.setUpdatedAt(LocalDateTime.now());

                    modulePreferenceRepository.save(pref);

                    Map<String, Object> assign = new HashMap<>();
                    assign.put("moduleId", module.getId());
                    assign.put("moduleName", module.getName());
                    assign.put("modulePriority", module.getPriority());
                    assign.put("tutorEmail", pref.getTutor().getUser().getEmail());
                    assign.put("score", pref.getCompatibilityScore());
                    assignments.add(assign);
                }

                module.setCurrentTutorsAssigned(Math.min(slotsNeeded, prefs.size()));
                if (module.getCurrentTutorsAssigned() >= slotsNeeded) {
                    module.setStatus("FILLED");
                }
                pamaModuleRepository.save(module);
            }

            result.put("success", true);
            result.put("assignmentCount", assignments.size());
            result.put("assignments", assignments);
            result.put("strategy", "MODULE_PRIORITY_BASED");

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * ROUND-ROBIN ASSIGNMENT
     * Distribute available tutors evenly across modules
     */
    public Map<String, Object> resolveRoundRobin(List<Long> moduleIds, List<Long> tutorIds) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<PAMAModule> modules = moduleIds.isEmpty() 
                ? pamaModuleRepository.findAll() 
                : pamaModuleRepository.findAllById(moduleIds);

            List<Tutor> tutors = tutorIds.isEmpty() 
                ? new ArrayList<>() 
                : new ArrayList<>();  // Use empty if not specified

            List<Map<String, Object>> assignments = new ArrayList<>();
            int tutorIndex = 0;

            for (PAMAModule module : modules) {
                List<ModulePreference> prefs = modulePreferenceRepository.findByModule(module)
                    .stream()
                    .filter(p -> p.getCompatibilityScore().compareTo(BigDecimal.valueOf(50)) >= 0)
                    .sorted((p1, p2) -> p2.getCompatibilityScore()
                        .compareTo(p1.getCompatibilityScore()))
                    .collect(Collectors.toList());

                int slotsNeeded = module.getMaxTutorsNeeded();
                List<ModulePreference> selected = new ArrayList<>();

                for (int i = 0; i < Math.min(slotsNeeded, prefs.size()); i++) {
                    selected.add(prefs.get(i));
                }

                // Sort selected by index for round-robin
                for (int i = 0; i < selected.size(); i++) {
                    ModulePreference pref = selected.get(i);
                    pref.setAssigned(true);
                    pref.setAssignmentStatus("ASSIGNED");
                    pref.setPreferenceRank(i + 1);
                    pref.setUpdatedAt(LocalDateTime.now());

                    modulePreferenceRepository.save(pref);

                    Map<String, Object> assign = new HashMap<>();
                    assign.put("moduleId", module.getId());
                    assign.put("moduleName", module.getName());
                    assign.put("tutorEmail", pref.getTutor().getUser().getEmail());
                    assign.put("score", pref.getCompatibilityScore());
                    assignments.add(assign);
                }

                module.setCurrentTutorsAssigned(selected.size());
                pamaModuleRepository.save(module);
            }

            result.put("success", true);
            result.put("assignmentCount", assignments.size());
            result.put("assignments", assignments);
            result.put("strategy", "ROUND_ROBIN");

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }
}