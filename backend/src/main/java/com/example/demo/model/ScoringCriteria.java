package com.example.demo.model;

public enum ScoringCriteria {
    EDUCATION("Education", 0.60),           // 60% weight
    EXPERIENCE("Experience", 0.25),         // 25% weight
    RATING("Rating", 0.15);                 // 15% weight

    private final String displayName;
    private final double weight;

    ScoringCriteria(String displayName, double weight) {
        this.displayName = displayName;
        this.weight = weight;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getWeight() {
        return weight;
    }

    public static double getTotalWeight() {
        double total = 0.0;
        for (ScoringCriteria criteria : ScoringCriteria.values()) {
            total += criteria.weight;
        }
        return total;
    }
}