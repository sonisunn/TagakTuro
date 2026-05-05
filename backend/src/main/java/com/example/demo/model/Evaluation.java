package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_evaluation_booking_type",
        columnNames = {"booking_id", "evaluation_type"}))
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonIgnoreProperties({"student", "hibernateLazyInitializer", "handler"})
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User evaluator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluatee_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User evaluatee;

    @Column(name = "evaluation_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EvaluationType evaluationType;

    @Column(name = "q1_answer", nullable = false, length = 1)
    private String q1Answer;

    @Column(name = "q2_answer", nullable = false, length = 1)
    private String q2Answer;

    // nullable — student evaluation form has only 2 MCQ questions
    @Column(name = "q3_answer", length = 1)
    private String q3Answer;

    @Column(name = "open_comment", length = 1000)
    private String openComment;

    @Column(name = "star_rating", nullable = false)
    private Integer starRating = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum EvaluationType {
        TUTOR_EVALUATES_STUDENT,
        STUDENT_EVALUATES_TUTOR
    }

    public Evaluation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public User getEvaluator() { return evaluator; }
    public void setEvaluator(User evaluator) { this.evaluator = evaluator; }

    public User getEvaluatee() { return evaluatee; }
    public void setEvaluatee(User evaluatee) { this.evaluatee = evaluatee; }

    public EvaluationType getEvaluationType() { return evaluationType; }
    public void setEvaluationType(EvaluationType evaluationType) { this.evaluationType = evaluationType; }

    public String getQ1Answer() { return q1Answer; }
    public void setQ1Answer(String q1Answer) { this.q1Answer = q1Answer; }

    public String getQ2Answer() { return q2Answer; }
    public void setQ2Answer(String q2Answer) { this.q2Answer = q2Answer; }

    public String getQ3Answer() { return q3Answer; }
    public void setQ3Answer(String q3Answer) { this.q3Answer = q3Answer; }

    public String getOpenComment() { return openComment; }
    public void setOpenComment(String openComment) { this.openComment = openComment; }

    public Integer getStarRating() { return starRating; }
    public void setStarRating(Integer starRating) { this.starRating = starRating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
