package com.example.demo.controller;

import com.example.demo.model.Module;
import com.example.demo.service.ModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = "*")
public class ModuleController {

    @Autowired
    private ModuleService moduleService;

    /**
     * Get all active modules
     * GET /api/modules
     */
    @GetMapping
    public ResponseEntity<List<Module>> getAllModules() {
        return ResponseEntity.ok(moduleService.getAllActiveModules());
    }

    /**
     * Get module by ID
     * GET /api/modules/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Module> getModuleById(@PathVariable Long id) {
        Optional<Module> module = moduleService.getModuleById(id);
        return module.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get module capacity status
     * GET /api/modules/{id}/capacity
     */
    @GetMapping("/{id}/capacity")
    public ResponseEntity<Map<String, Object>> getModuleCapacity(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(moduleService.getModuleCapacityStatus(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).build();
        }
    }

    /**
     * Update module
     * PUT /api/modules/{id}
     * Body: { "description": "Updated description", "capacity": 10 }
     */
    @PutMapping("/{id}")
    public ResponseEntity<Module> updateModule(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String description = (String) request.get("description");
            Integer capacity = request.get("capacity") != null ? ((Number) request.get("capacity")).intValue() : null;

            Module updated = moduleService.updateModule(id, description, capacity);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(404).build();
        }
    }

    /**
     * Deactivate module
     * DELETE /api/modules/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deactivateModule(@PathVariable Long id) {
        try {
            moduleService.deactivateModule(id);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Module deactivated successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
}