package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "pama_preferences",
    indexes = {
        // MySQL requires an index on FK columns; Hibernate doesn't always add one for join columns
        @Index(name = "idx_pama_preferences_tutor_id", columnList = "tutor_id"),
        @Index(name = "idx_pama_preferences_module_id", columnList = "module_id")
    }
)
public class PAMAPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(
        name = "tutor_id",
        nullable = false,
        // Avoid MySQL FK DDL errors on older versions; we still store IDs and can
        // add FK constraints later if needed.
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