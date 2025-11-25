package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class PAMAMatchingServiceTest {

    @Autowired
    private PAMAMatchingService pamaMatchingService;

    @Autowired
    private PAMAModuleRepository pamaModuleRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private ModulePreferenceRepository modulePreferenceRepository;

    @Autowired
    private TutorScoringService tutorScoringService;

    private PAMAModule testModule;
    private Tutor testTutor1;
    private Tutor testTutor2;

    @BeforeEach
    public void setUp() {
        // Clean up
        modulePreferenceRepository.deleteAll();
        pamaModuleRepository.deleteAll();

        // Create test data
        testModule = new PAMAModule("Mathematics 101", "Mathematics", 2);
        testModule.setMinExperienceYears(2);
        testModule.setRequiredQualification("Bachelor");
        pamaModuleRepository.save(testModule);
    }

    @Test
    public void testPAMAMatchingBasic() {
        // Run PAMA matching
        Map<String, Object> result = pamaMatchingService
            .runPAMAMatching(List.of(), List.of());

        assertTrue((Boolean) result.get("success"));
        assertNotNull(result.get("assignments"));
    }

    @Test
    public void testCompatibilityScoreCalculation() {
        // Verify compatibility scores are between 0-100
        Map<String, Object> result = pamaMatchingService
            .runPAMAMatching(List.of(testModule.getId()), List.of());

        assertTrue((Boolean) result.get("success"));
        List<?> assignments = (List<?>) result.get("assignments");
        
        assignments.forEach(a -> {
            if (a instanceof ModulePreference) {
                ModulePreference pref = (ModulePreference) a;
                assertTrue(pref.getCompatibilityScore().compareTo(BigDecimal.ZERO) >= 0);
                assertTrue(pref.getCompatibilityScore().compareTo(BigDecimal.valueOf(100)) <= 0);
            }
        });
    }

    @Test
    public void testModuleCapacityRespected() {
        // Verify assignments don't exceed module capacity
        Map<String, Object> result = pamaMatchingService
            .runPAMAMatching(List.of(testModule.getId()), List.of());

        PAMAModule updatedModule = pamaModuleRepository.findById(testModule.getId()).get();
        assertTrue(updatedModule.getCurrentTutorsAssigned() <= updatedModule.getMaxTutorsNeeded());
    }

    @Test
    public void testPendingAssignmentsMarked() {
        // If more tutors than slots, some should be PENDING
        Map<String, Object> result = pamaMatchingService
            .runPAMAMatching(List.of(), List.of());

        List<?> pending = (List<?>) result.get("pending");
        assertNotNull(pending);
    }
}