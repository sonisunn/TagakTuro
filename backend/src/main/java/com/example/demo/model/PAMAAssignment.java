package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "pama_assignments",
    indexes = {
        // MySQL requires an index on FK columns; add them explicitly for join columns.
        @Index(name = "idx_pama_assignments_tutor_id", columnList = "tutor_id"),
        @Index(name = "idx_pama_assignments_module_id", columnList = "module_id")
    }
)
public class PAMAAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(
        name = "tutor_id",
        nullable = false,
        foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)
    )
    private Tutor tutor;

    @ManyToOne
    @JoinColumn(
        name = "module_id",
        nullable = false,
        foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)
    )
    private Module module;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private AssignmentStatus status;

    @Column(name = "round_number")
    private Integer roundNumber;

    @Column(name = "matching_score")
    private Double matchingScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AssignmentStatus {
        PENDING, CONFIRMED, REJECTED, DEADLOCK
    }

    public PAMAAssignment() {}

    public PAMAAssignment(Tutor tutor, Module module, AssignmentStatus status, Integer roundNumber, Double matchingScore) {
        this.tutor = tutor;
        this.module = module;
        this.status = status;
        this.roundNumber = roundNumber;
        this.matchingScore = matchingScore;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tutor getTutor() { return tutor; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }

    public Module getModule() { return module; }
    public void setModule(Module module) { this.module = module; }

    public AssignmentStatus getStatus() { return status; }
    public void setStatus(AssignmentStatus status) { this.status = status; }

    public Integer getRoundNumber() { return roundNumber; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }

    public Double getMatchingScore() { return matchingScore; }
    public void setMatchingScore(Double matchingScore) { this.matchingScore = matchingScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // THIS METHOD IS CRITICAL FOR FIXING THE ERROR!!
    public String getModuleName() {
        return module != null ? module.getModuleName() : "Unknown";
    }
}