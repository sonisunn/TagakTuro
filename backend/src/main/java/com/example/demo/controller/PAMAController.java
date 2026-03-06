package com.example.demo.controller;

import com.example.demo.model.PAMAAssignment;
import com.example.demo.model.PAMAPreference;
import com.example.demo.model.Module;
import com.example.demo.service.PAMAService;
import com.example.demo.service.ModuleService;
import com.example.demo.dto.PAMAExecuteRequest;
import com.example.demo.dto.PAMAPreferenceRequest;
import com.example.demo.dto.ModuleCreateRequest; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pama")
@CrossOrigin(origins = "*")
public class PAMAController {

    @Autowired
    private PAMAService pamaService;

    @Autowired
    private ModuleService moduleService;

    /**
     * Execute PAMA matching algorithm
     * POST /api/pama/execute
     * Body: { "moduleIds": [1, 2, 3] }
     */
    @PostMapping("/execute")
    // DTO CHANGE: Use PAMAExecuteRequest instead of Map<String, Object>
    public ResponseEntity<Map<String, String>> executePAMA(@RequestBody PAMAExecuteRequest request) {
        try {
            // SAFE ACCESS: No casting or @SuppressWarnings needed
            List<Long> moduleIds = request.getModuleIds();
            
            if (moduleIds == null || moduleIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "moduleIds cannot be empty"
                ));
            }

            pamaService.executePAMA(moduleIds);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "PAMA matching algorithm executed successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Get confirmed assignments
     * GET /api/pama/assignments/confirmed
     */
    @GetMapping("/assignments/confirmed")
    public ResponseEntity<List<PAMAAssignment>> getConfirmedAssignments() {
        return ResponseEntity.ok(pamaService.getConfirmedAssignments());
    }

    /**
     * Get assignments by module
     * GET /api/pama/assignments/module/{moduleId}
     */
    @GetMapping("/assignments/module/{moduleId}")
    public ResponseEntity<List<PAMAAssignment>> getAssignmentsByModule(@PathVariable Long moduleId) {
        return ResponseEntity.ok(pamaService.getAssignmentsByModule(moduleId));
    }

    /**
     * Get tutor assignments
     * GET /api/pama/assignments/tutor/{tutorId}
     */
    @GetMapping("/assignments/tutor/{tutorId}")
    public ResponseEntity<List<PAMAAssignment>> getTutorAssignments(@PathVariable Long tutorId) {
        return ResponseEntity.ok(pamaService.getTutorAssignments(tutorId));
    }

    /**
     * Set tutor preference
     * POST /api/pama/preference
     * Body: { "tutorId": 1, "moduleId": 1, "rank": 1, "score": 0.95 }
     */
    @PostMapping("/preference")
    // DTO CHANGE: Use PAMAPreferenceRequest instead of Map<String, Object>
    public ResponseEntity<Map<String, Object>> setTutorPreference(@RequestBody PAMAPreferenceRequest request) {
        try {
            // SAFE ACCESS: No casting or @SuppressWarnings needed
            Long tutorId = request.getTutorId();
            Long moduleId = request.getModuleId();
            Integer rank = request.getRank();
            Double score = request.getScore();

            PAMAPreference preference = pamaService.setTutorPreference(tutorId, moduleId, rank, score);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Preference set successfully",
                "preference", preference
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Get all active modules
     * GET /api/pama/modules
     */
    @GetMapping("/modules")
    public ResponseEntity<List<Module>> getAllModules() {
        return ResponseEntity.ok(pamaService.getAllModules());
    }

    /**
     * Create new module
     * POST /api/pama/modules
     * Body: { "moduleName": "Mathematics", "description": "Basic Math", "capacity": 5 }
     */
    @PostMapping("/modules")
    // DTO CHANGE: Use ModuleCreateRequest instead of Map<String, Object>
    public ResponseEntity<Map<String, Object>> createModule(@RequestBody ModuleCreateRequest request) {
        try {
            // SAFE ACCESS: No casting or @SuppressWarnings needed
            String moduleName = request.getModuleName();
            String description = request.getDescription();
            Integer capacity = request.getCapacity();

            Module module = pamaService.createModule(moduleName, description, capacity);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Module created successfully",
                "module", module
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
}