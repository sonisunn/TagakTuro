package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "pama_preferences")
public class PAMAPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(name = "preference_rank")
    private Integer preferenceRank; // The field is named 'preferenceRank'

    @Column(name = "score")
    private Double score;

    // Constructors
    public PAMAPreference() {}

    public PAMAPreference(Tutor tutor, Module module, Integer preferenceRank, Double score) {
        this.tutor = tutor;
        this.module = module;
        this.preferenceRank = preferenceRank;
        this.score = score;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tutor getTutor() { return tutor; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }

    public Module getModule() { return module; }
    public void setModule(Module module) { this.module = module; }

    public Integer getPreferenceRank() { return preferenceRank; }
    // This is the correct setter that the code should be calling!
    public void setPreferenceRank(Integer preferenceRank) { this.preferenceRank = preferenceRank; } 

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    // Removed the problematic public void setRank(Integer rank) { ... } method

}