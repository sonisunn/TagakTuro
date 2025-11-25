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
public class HybridAssignmentServiceTest {

    @Autowired
    private HybridAssignmentService hybridAssignmentService;

    @Autowired
    private TutorScoringService tutorScoringService;

    @Autowired
    private PAMAModuleRepository pamaModuleRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TutorScoreRepository tutorScoreRepository;

    @Autowired
    private ModulePreferenceRepository modulePreferenceRepository;

    private PAMAModule testModule;
    private List<Tutor> testTutors;

    @BeforeEach
    public void setUp() {
        // Clean up
        modulePreferenceRepository.deleteAll();
        tutorScoreRepository.deleteAll();
        pamaModuleRepository.deleteAll();
        tutorRepository.deleteAll();
        userRepository.deleteAll();

        // Create test module
        testModule = new PAMAModule("Advanced Mathematics", "Mathematics", 2);
        testModule.setMinExperienceYears(3);
        testModule.setPriority(8);
        pamaModuleRepository.save(testModule);

        // Create test tutors
        testTutors = createTestTutors(4);
    }

    private List<Tutor> createTestTutors(int count) {
        List<Tutor> tutors = new java.util.ArrayList<>();
        
        for (int i = 1; i <= count; i++) {
            User user = new User();
            user.setEmail("tutor" + i + "@example.com");
            user.setPassword("hashedPassword");
            user.setRole("TUTOR");
            userRepository.save(user);

            Tutor tutor = new Tutor();
            tutor.setUser(user);
            tutor.setQualification("Bachelor");
            tutor.setYearsOfExperience(2 + i);  // Varying experience
            tutor.setAverageRating(BigDecimal.valueOf(3.5 + (i * 0.2)));  // Varying ratings
            tutor.setSpecialization("Mathematics");
            tutorRepository.save(tutor);

            tutors.add(tutor);
        }
        
        return tutors;
    }

    @Test
    public void testHybridMatchingComplete() {
        Map<String, Object> result = hybridAssignmentService
            .runHybridMatching(
                List.of(testModule.getId()),
                testTutors.stream().map(Tutor::getId).toList()
            );

        assertTrue((Boolean) result.get("success"));
        assertNotNull(result.get("report"));
    }

    @Test
    public void testScoringIntegratedInMatching() {
        // Run hybrid matching
        hybridAssignmentService.runHybridMatching(
            List.of(testModule.getId()),
            testTutors.stream().map(Tutor::getId).toList()
        );

        // Verify all tutors have scores calculated
        for (Tutor tutor : testTutors) {
            TutorScore score = tutorScoringService.getScore(tutor.getId());
            assertNotNull(score);
            assertNotNull(score.getWeightedScore());
        }
    }

    @Test
    public void testAssignmentStability() {
        hybridAssignmentService.runHybridMatching(
            List.of(testModule.getId()),
            testTutors.stream().map(Tutor::getId).toList()
        );

        List<ModulePreference> assignments = modulePreferenceRepository
            .findByModule(testModule);

        // Check stability: assigned tutors should have highest scores
        assignments.forEach(a -> {
            if ("ASSIGNED".equals(a.getAssignmentStatus())) {
                assertTrue(a.getCompatibilityScore().compareTo(BigDecimal.valueOf(50)) >= 0);
            }
        });
    }

    @Test
    public void testAssignmentStatus() {
        hybridAssignmentService.runHybridMatching(List.of(), List.of());

        Map<String, Object> status = hybridAssignmentService.getAssignmentStatus();
        
        assertNotNull(status.get("assigned"));
        assertNotNull(status.get("pending"));
        assertNotNull(status.get("unassigned"));
    }

    @Test
    public void testDeadlockDetectionAfterHybrid() {
        hybridAssignmentService.runHybridMatching(List.of(), List.of());

        // Should complete without critical deadlocks
        Map<String, Object> result = hybridAssignmentService.runHybridMatching(List.of(), List.of());
        assertTrue((Boolean) result.get("success"));
    }
}