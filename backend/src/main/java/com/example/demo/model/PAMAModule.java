package com.example.demo.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pama_module")
public class PAMAModule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "description")
    private String description;

    @Column(name = "required_qualification")
    private String requiredQualification;

    @Column(name = "min_experience_years")
    private Integer minExperienceYears;

    @Column(name = "max_tutors_needed", nullable = false)
    private Integer maxTutorsNeeded;

    @Column(name = "current_tutors_assigned")
    private Integer currentTutorsAssigned;

    @Column(name = "status")
    private String status;  // OPEN, FILLED, CLOSED

    @Column(name = "priority")
    private Integer priority;  // 1-10 scale

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public PAMAModule() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.currentTutorsAssigned = 0;
        this.status = "OPEN";
    }

    public PAMAModule(String name, String subject, Integer maxTutorsNeeded) {
        this();
        this.name = name;
        this.subject = subject;
        this.maxTutorsNeeded = maxTutorsNeeded;
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequiredQualification() {
        return requiredQualification;
    }

    public void setRequiredQualification(String requiredQualification) {
        this.requiredQualification = requiredQualification;
    }

    public Integer getMinExperienceYears() {
        return minExperienceYears;
    }

    public void setMinExperienceYears(Integer minExperienceYears) {
        this.minExperienceYears = minExperienceYears;
    }

    public Integer getMaxTutorsNeeded() {
        return maxTutorsNeeded;
    }

    public void setMaxTutorsNeeded(Integer maxTutorsNeeded) {
        this.maxTutorsNeeded = maxTutorsNeeded;
    }

    public Integer getCurrentTutorsAssigned() {
        return currentTutorsAssigned;
    }

    public void setCurrentTutorsAssigned(Integer currentTutorsAssigned) {
        this.currentTutorsAssigned = currentTutorsAssigned;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
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
        return "PAMAModule{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", subject='" + subject + '\'' +
                ", maxTutorsNeeded=" + maxTutorsNeeded +
                ", currentTutorsAssigned=" + currentTutorsAssigned +
                ", status='" + status + '\'' +
                ", priority=" + priority +
                '}';
    }
}