package com.example.demo.service;

import com.example.demo.model.Module;
import com.example.demo.repository.ModuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;     
import java.util.HashMap;
import java.util.Optional;

@Service
@Transactional
public class ModuleService {

    @Autowired
    private ModuleRepository moduleRepository;

    /**
     * Get ALL modules (Active and Inactive)
     * FIX: Added to satisfy PAMAController call
     */
    public List<Module> getAllModules() {
        return moduleRepository.findAll();
    }

    /**
     * Create a new module from Object
     * FIX: Added to satisfy PAMAController call
     */
    public Module createModule(Module module) {
        Optional<Module> existing = moduleRepository.findByModuleName(module.getModuleName());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Module already exists: " + module.getModuleName());
        }
        // Ensure defaults are set
        if (module.getCurrentTutors() == null) module.setCurrentTutors(0);
        if (module.getIsActive() == null) module.setIsActive(true);
        if (module.getCreatedAt() == null) module.setCreatedAt(LocalDateTime.now());
        if (module.getUpdatedAt() == null) module.setUpdatedAt(LocalDateTime.now());
        
        return moduleRepository.save(module);
    }

    /**
     * Create a new module (Arguments)
     */
    public Module createModule(String moduleName, String description, Integer capacity) {
        Optional<Module> existing = moduleRepository.findByModuleName(moduleName);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Module already exists: " + moduleName);
        }
        Module module = new Module(moduleName, description, capacity);
        return moduleRepository.save(module);
    }

    /**
     * Get all active modules (for dropdowns, etc.)
     */
    public List<Module> getAllActiveModules() {
        return moduleRepository.findByIsActive(true);
    }

    /**
     * Get module by ID
     */
    @SuppressWarnings("null")
    public Optional<Module> getModuleById(Long id) {
        return moduleRepository.findById(id);
    }

    /**
     * Get module by name
     */
    public Optional<Module> getModuleByName(String moduleName) {
        return moduleRepository.findByModuleName(moduleName);
    }

    /**
     * Update module
     */
    @SuppressWarnings("null")
    public Module updateModule(Long id, String description, Integer capacity) {
        Module module = moduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Module not found"));
        
        if (description != null) {
            module.setDescription(description);
        }
        if (capacity != null) {
            module.setCapacity(capacity);
        }
        module.setUpdatedAt(LocalDateTime.now());
        return moduleRepository.save(module);
    }

    /**
     * Deactivate module (soft delete)
     */
    @SuppressWarnings("null")
    public Module deactivateModule(Long id) {
        Module module = moduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Module not found"));
        module.setIsActive(false);
        module.setUpdatedAt(LocalDateTime.now());
        return moduleRepository.save(module);
    }

    /**
     * Get module capacity status (for dashboard)
     */
    @SuppressWarnings("null")
    public Map<String, Object> getModuleCapacityStatus(Long id) {
        Module module = moduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Module not found"));
        
        Map<String, Object> status = new HashMap<>();
        status.put("moduleId", module.getId());
        status.put("moduleName", module.getModuleName());
        status.put("totalCapacity", module.getCapacity());
        status.put("currentTutors", module.getCurrentTutors() != null ? module.getCurrentTutors() : 0);
        status.put("availableSlots", module.getCapacity() - (module.getCurrentTutors() != null ? module.getCurrentTutors() : 0));
        status.put("percentageFilled", ((module.getCurrentTutors() != null ? module.getCurrentTutors() : 0) * 100.0) / module.getCapacity());
        
        return status;
    }
}