package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.model.Module;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PAMAService {

    @Autowired
    private PAMAAssignmentRepository pamaAssignmentRepository;
    @Autowired
    private ModuleRepository moduleRepository;
    @Autowired
    private TutorRepository tutorRepository;
    @Autowired
    private PAMAPreferenceRepository preferenceRepository;
    @Autowired
    private ModuleService moduleService;

    // The Core Loop 
    @Transactional
    public void executePAMA(List<Long> moduleIds) {
        for (Long moduleId : moduleIds) {
            Module module = moduleRepository.findById(moduleId).orElse(null);
            if (module != null && module.getIsActive()) {
                // Algorithm logic placeholder
            }
        }
    }

    public PAMAPreference setTutorPreference(Long tutorId, Long moduleId, Integer rank, Double score) {
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new RuntimeException("Tutor not found"));
        Module module = moduleRepository.findById(moduleId)
            .orElseThrow(() -> new RuntimeException("Module not found"));

        PAMAPreference pref = new PAMAPreference();
        pref.setTutor(tutor);
        pref.setModule(module);
        
    
        // The correct method from PAMAPreference is setPreferenceRank
        pref.setPreferenceRank(rank); 
        // ----------------------------
        
        pref.setScore(score);
        return preferenceRepository.save(pref);
    }

    // The Core Loop ^

    public List<PAMAAssignment> getConfirmedAssignments() {
        return pamaAssignmentRepository.findAll();
    }

    public List<PAMAAssignment> getAssignmentsByModule(Long moduleId) {
        return pamaAssignmentRepository.findByModuleId(moduleId);
    }

    public List<PAMAAssignment> getTutorAssignments(Long tutorId) {
        return pamaAssignmentRepository.findByTutorId(tutorId);
    }

    // FIX: Added delegate to fix "cannot find symbol getAllModules"
    public List<Module> getAllModules() {
        return moduleService.getAllModules();
    }

    // FIX: Added delegate to fix "cannot find symbol createModule"
    public Module createModule(String name, String desc, Integer capacity) {
        return moduleService.createModule(name, desc, capacity);
    }
}