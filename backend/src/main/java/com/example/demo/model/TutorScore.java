package com.example.demo.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tutor_score")
public class TutorScore {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "tutor_id", nullable = false, unique = true)
    private Tutor tutor;

    @Column(name = "education_score", precision = 5, scale = 2)
    private BigDecimal educationScore;      // 0-100

    @Column(name = "experience_score", precision = 5, scale = 2)
    private BigDecimal experienceScore;     // 0-100

    @Column(name = "rating_score", precision = 5, scale = 2)
    private BigDecimal ratingScore;         // 0-100

    @Column(name = "weighted_score", precision = 5, scale = 2)
    private BigDecimal weightedScore;       // 0-100 (calculated)

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public TutorScore() {
        this.lastUpdated = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public TutorScore(Tutor tutor) {
        this.tutor = tutor;
        this.lastUpdated = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Tutor getTutor() {
        return tutor;
    }

    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }

    public BigDecimal getEducationScore() {
        return educationScore;
    }

    public void setEducationScore(BigDecimal educationScore) {
        this.educationScore = educationScore;
    }

    public BigDecimal getExperienceScore() {
        return experienceScore;
    }

    public void setExperienceScore(BigDecimal experienceScore) {
        this.experienceScore = experienceScore;
    }

    public BigDecimal getRatingScore() {
        return ratingScore;
    }

    public void setRatingScore(BigDecimal ratingScore) {
        this.ratingScore = ratingScore;
    }

    public BigDecimal getWeightedScore() {
        return weightedScore;
    }

    public void setWeightedScore(BigDecimal weightedScore) {
        this.weightedScore = weightedScore;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "TutorScore{" +
                "id=" + id +
                ", tutor=" + tutor.getId() +
                ", educationScore=" + educationScore +
                ", experienceScore=" + experienceScore +
                ", ratingScore=" + ratingScore +
                ", weightedScore=" + weightedScore +
                ", lastUpdated=" + lastUpdated +
                '}';
    }
}