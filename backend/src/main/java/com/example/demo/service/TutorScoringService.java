package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.TutorScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TutorScoringService {

    @Autowired
    private TutorScoreRepository tutorScoreRepository;

    @Autowired
    private TutorRepository tutorRepository;

    /**
     * Calculate weighted score for a tutor
     * Formula: (Education * 0.60) + (Experience * 0.25) + (Rating * 0.15)
     */
    public TutorScore calculateScore(Long tutorId) {
        Optional<Tutor> tutorOpt = tutorRepository.findById(tutorId);
        if (!tutorOpt.isPresent()) {
            throw new IllegalArgumentException("Tutor not found with ID: " + tutorId);
        }

        Tutor tutor = tutorOpt.get();
        TutorScore tutorScore = tutorScoreRepository.findByTutorId(tutorId)
                .orElse(new TutorScore(tutor));

        // Get component scores from tutor data
        BigDecimal educationScore = getEducationScore(tutor);
        BigDecimal experienceScore = getExperienceScore(tutor);
        BigDecimal ratingScore = getRatingScore(tutor);

        // Set individual scores
        tutorScore.setEducationScore(educationScore);
        tutorScore.setExperienceScore(experienceScore);
        tutorScore.setRatingScore(ratingScore);

        // Calculate weighted score
        BigDecimal weightedScore = calculateWeightedScore(
                educationScore,
                experienceScore,
                ratingScore
        );

        tutorScore.setWeightedScore(weightedScore);
        tutorScore.setLastUpdated(LocalDateTime.now());

        return tutorScoreRepository.save(tutorScore);
    }

    /**
     * Calculate weighted score from components
     */
    private BigDecimal calculateWeightedScore(
            BigDecimal educationScore,
            BigDecimal experienceScore,
            BigDecimal ratingScore) {

        BigDecimal education = educationScore.multiply(
                BigDecimal.valueOf(ScoringCriteria.EDUCATION.getWeight())
        );
        BigDecimal experience = experienceScore.multiply(
                BigDecimal.valueOf(ScoringCriteria.EXPERIENCE.getWeight())
        );
        BigDecimal rating = ratingScore.multiply(
                BigDecimal.valueOf(ScoringCriteria.RATING.getWeight())
        );

        BigDecimal weighted = education.add(experience).add(rating);
        return weighted.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Extract education score from tutor data (0-100)
     * Criteria: Degree level, certifications, qualifications
     */
    private BigDecimal getEducationScore(Tutor tutor) {
        // Base score based on educational qualification
        BigDecimal score = BigDecimal.ZERO;

        if (tutor.getQualification() != null) {
            String qualification = tutor.getQualification().toUpperCase();
            if (qualification.contains("BACHELOR") || qualification.contains("DEGREE")) {
                score = BigDecimal.valueOf(75);
            } else if (qualification.contains("MASTER") || qualification.contains("POSTGRADUATE")) {
                score = BigDecimal.valueOf(90);
            } else if (qualification.contains("DIPLOMA")) {
                score = BigDecimal.valueOf(60);
            } else {
                score = BigDecimal.valueOf(50);
            }
        }

        return score.min(BigDecimal.valueOf(100)).max(BigDecimal.ZERO);
    }

    /**
     * Extract experience score from tutor data (0-100)
     * Criteria: Years of teaching experience
     */
    private BigDecimal getExperienceScore(Tutor tutor) {
        // Assume tutor has yearsOfExperience field or calculate from joinDate
        BigDecimal score = BigDecimal.ZERO;

        if (tutor.getYearsOfExperience() != null) {
            Integer years = tutor.getYearsOfExperience();
            // 1 year = 10 points, max 100 points at 10+ years
            score = BigDecimal.valueOf(Math.min(years * 10, 100));
        } else if (tutor.getCreatedAt() != null) {
            // Calculate from join date
            long monthsActive = java.time.temporal.ChronoUnit.MONTHS.between(
                    tutor.getCreatedAt().toLocalDate(),
                    java.time.LocalDate.now()
            );
            long yearsActive = monthsActive / 12;
            score = BigDecimal.valueOf(Math.min(yearsActive * 10, 100));
        }

        return score.min(BigDecimal.valueOf(100)).max(BigDecimal.ZERO);
    }

    /**
     * Extract rating score from tutor data (0-100)
     * Criteria: Student ratings and reviews
     */
    private BigDecimal getRatingScore(Tutor tutor) {
        // Assume tutor has averageRating field (e.g., 4.5 out of 5)
        BigDecimal score = BigDecimal.ZERO;

        if (tutor.getAverageRating() != null) {
            // Convert 5-star rating to 100-point scale
            score = tutor.getAverageRating().multiply(BigDecimal.valueOf(20));
        } else {
            // Default neutral score if no ratings yet
            score = BigDecimal.valueOf(50);
        }

        return score.min(BigDecimal.valueOf(100)).max(BigDecimal.ZERO);
    }

    /**
     * Get score for a specific tutor
     */
    public TutorScore getScore(Long tutorId) {
        return tutorScoreRepository.findByTutorId(tutorId)
                .orElseThrow(() -> new IllegalArgumentException("Score not found for tutor: " + tutorId));
    }

    /**
     * Recalculate all tutor scores
     */
    public void recalculateAllScores() {
        tutorRepository.findAll().forEach(tutor -> {
            calculateScore(tutor.getId());
        });
    }

    /**
     * Get tutor score as percentage (0-100)
     */
    public BigDecimal getScorePercentage(Long tutorId) {
        TutorScore score = getScore(tutorId);
        return score.getWeightedScore();
    }
}