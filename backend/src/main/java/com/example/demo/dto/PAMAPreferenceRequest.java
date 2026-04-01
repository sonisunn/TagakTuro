package com.example.demo.dto;

public class PAMAPreferenceRequest {
    private Long tutorId;
    private Long moduleId;
    private Integer rank;
    private Double score;

    // Getters
    public Long getTutorId() {
        return tutorId;
    }

    public Long getModuleId() {
        return moduleId;
    }

    public Integer getRank() {
        return rank;
    }

    public Double getScore() {
        return score;
    }

    // Setters
    public void setTutorId(Long tutorId) {
        this.tutorId = tutorId;
    }

    public void setModuleId(Long moduleId) {
        this.moduleId = moduleId;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public void setScore(Double score) {
        this.score = score;
    }
}