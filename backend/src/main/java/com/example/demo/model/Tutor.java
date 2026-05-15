package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "tutors")
public class Tutor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String tutorId;

    @Column(nullable = false, unique = true)
    private String email;

    private String phoneNumber;
    private String courseProgram;
    private Integer sessionsDone = 0;
    private Double totalHours = 0.0;
    private Double rating = 0.0;

    @Column(name = "is_cert_issued")
    private Boolean isCertIssued = false;

    // Transient — computed at read time in TutorService.enrichTutorStats().
    // A tutor is "active" if they have at least one booking (any status) in the
    // INACTIVITY_THRESHOLD_DAYS window (default 30 days). Not persisted.
    @Transient
    private Boolean isActive = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    @JsonIgnore
    private User user;

    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TutorAvailability> availabilities = new ArrayList<>();

    // Constructors
    public Tutor() {
    }

    public Tutor(String name, String tutorId, String email, String phoneNumber, String courseProgram) {
        this.name = name;
        this.tutorId = tutorId;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.courseProgram = courseProgram;
        this.sessionsDone = 0;
        this.totalHours = 0.0;
        this.rating = 0.0;
        this.isCertIssued = false;
    }

    // Getters and Setters
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

    public String getTutorId() {
        return tutorId;
    }

    public void setTutorId(String tutorId) {
        this.tutorId = tutorId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getCourseProgram() {
        return courseProgram;
    }

    public void setCourseProgram(String courseProgram) {
        this.courseProgram = courseProgram;
    }

    public Integer getSessionsDone() {
        return sessionsDone;
    }

    public void setSessionsDone(Integer sessionsDone) {
        this.sessionsDone = sessionsDone;
    }

    public Double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(Double totalHours) {
        this.totalHours = totalHours;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Boolean getIsCertIssued() {
        return isCertIssued;
    }

    public void setIsCertIssued(Boolean isCertIssued) {
        this.isCertIssued = isCertIssued;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    public List<TutorAvailability> getAvailabilities() {
        return availabilities;
    }

    public void setAvailabilities(List<TutorAvailability> availabilities) {
        if (this.availabilities == null) {
            this.availabilities = new ArrayList<>();
        }
        this.availabilities.clear();
        if (availabilities != null) {
            this.availabilities.addAll(availabilities);
        }
    }
}
