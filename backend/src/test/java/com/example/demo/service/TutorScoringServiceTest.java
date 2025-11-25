package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TutorScoringServiceTest {

    @Autowired
    private TutorScoringService tutorScoringService;

    @Autowired
    private TutorScoreRepository tutorScoreRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private UserRepository userRepository;

    private Tutor testTutor;

    @BeforeEach
    public void setUp() {
        // Clean up
        tutorScoreRepository.deleteAll();
        tutorRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user and tutor
        User user = new User();
        user.setEmail("test.tutor@example.com");
        user.setPassword("hashedPassword");
        user.setRole("TUTOR");
        userRepository.save(user);

        testTutor = new Tutor();
        testTutor.setUser(user);
        testTutor.setQualification("Bachelor of Science");
        testTutor.setYearsOfExperience(5);
        testTutor.setAverageRating(BigDecimal.valueOf(4.5));
        testTutor.setSpecialization("Mathematics");
        tutorRepository.save(testTutor);
    }

    @Test
    public void testScoreCalculation() {
        TutorScore score = tutorScoringService.calculateScore(testTutor.getId());

        assertNotNull(score);
        assertNotNull(score.getEducationScore());
        assertNotNull(score.getExperienceScore());
        assertNotNull(score.getRatingScore());
        assertNotNull(score.getWeightedScore());
    }

    @Test
    public void testScoreRangeValidation() {
        TutorScore score = tutorScoringService.calculateScore(testTutor.getId());

        // All scores should be between 0 and 100
        assertTrue(score.getEducationScore().compareTo(BigDecimal.ZERO) >= 0);
        assertTrue(score.getEducationScore().compareTo(BigDecimal.valueOf(100)) <= 0);

        assertTrue(score.getExperienceScore().compareTo(BigDecimal.ZERO) >= 0);
        assertTrue(score.getExperienceScore().compareTo(BigDecimal.valueOf(100)) <= 0);

        assertTrue(score.getRatingScore().compareTo(BigDecimal.ZERO) >= 0);
        assertTrue(score.getRatingScore().compareTo(BigDecimal.valueOf(100)) <= 0);

        assertTrue(score.getWeightedScore().compareTo(BigDecimal.ZERO) >= 0);
        assertTrue(score.getWeightedScore().compareTo(BigDecimal.valueOf(100)) <= 0);
    }

    @Test
    public void testWeightedScoreFormula() {
        TutorScore score = tutorScoringService.calculateScore(testTutor.getId());

        // Formula: (Education * 0.60) + (Experience * 0.25) + (Rating * 0.15)
        BigDecimal expected = score.getEducationScore().multiply(BigDecimal.valueOf(0.60))
            .add(score.getExperienceScore().multiply(BigDecimal.valueOf(0.25)))
            .add(score.getRatingScore().multiply(BigDecimal.valueOf(0.15)));

        // Allow 0.1 difference due to rounding
        BigDecimal diff = score.getWeightedScore().subtract(expected).abs();
        assertTrue(diff.compareTo(BigDecimal.valueOf(0.1)) <= 0);
    }

    @Test
    public void testScorePersistence() {
        tutorScoringService.calculateScore(testTutor.getId());
        
        TutorScore retrieved = tutorScoringService.getScore(testTutor.getId());
        assertNotNull(retrieved);
        assertEquals(testTutor.getId(), retrieved.getTutor().getId());
    }

    @Test
    public void testScoreUpdate() {
        TutorScore score1 = tutorScoringService.calculateScore(testTutor.getId());
        BigDecimal initial = score1.getWeightedScore();

        // Update tutor
        testTutor.setAverageRating(BigDecimal.valueOf(5.0));
        tutorRepository.save(testTutor);

        TutorScore score2 = tutorScoringService.calculateScore(testTutor.getId());
        BigDecimal updated = score2.getWeightedScore();

        // Updated score should be higher
        assertTrue(updated.compareTo(initial) > 0);
    }
}