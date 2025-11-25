package com.example.demo.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "module_preference", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tutor_id", "module_id"})
})
public class ModulePreference {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    private PAMAModule module;

    @Column(name = "preference_rank")
    private Integer preferenceRank;  // 1 = most preferred, higher = less preferred

    @Column(name = "compatibility_score", precision = 5, scale = 2)
    private BigDecimal compatibilityScore;  // 0-100

    @Column(name = "is_interested")
    private Boolean isInterested;  // true/false

    @Column(name = "assigned")
    private Boolean assigned;  // true if tutor is assigned to this module

    @Column(name = "assignment_status")
    private String assignmentStatus;  // UNASSIGNED, PENDING, ASSIGNED, REJECTED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public ModulePreference() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.assigned = false;
        this.assignmentStatus = "UNASSIGNED";
    }

    public ModulePreference(Tutor tutor, PAMAModule module) {
        this();
        this.tutor = tutor;
        this.module = module;
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

    public PAMAModule getModule() {
        return module;
    }

    public void setModule(PAMAModule module) {
        this.module = module;
    }

    public Integer getPreferenceRank() {
        return preferenceRank;
    }

    public void setPreferenceRank(Integer preferenceRank) {
        this.preferenceRank = preferenceRank;
    }

    public BigDecimal getCompatibilityScore() {
        return compatibilityScore;
    }

    public void setCompatibilityScore(BigDecimal compatibilityScore) {
        this.compatibilityScore = compatibilityScore;
    }

    public Boolean getIsInterested() {
        return isInterested;
    }

    public void setIsInterested(Boolean isInterested) {
        this.isInterested = isInterested;
    }

    public Boolean getAssigned() {
        return assigned;
    }

    public void setAssigned(Boolean assigned) {
        this.assigned = assigned;
    }

    public String getAssignmentStatus() {
        return assignmentStatus;
    }

    public void setAssignmentStatus(String assignmentStatus) {
        this.assignmentStatus = assignmentStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "ModulePreference{" +
                "id=" + id +
                ", tutor=" + tutor.getId() +
                ", module=" + module.getId() +
                ", preferenceRank=" + preferenceRank +
                ", compatibilityScore=" + compatibilityScore +
                ", assignmentStatus='" + assignmentStatus + '\'' +
                '}';
    }
}