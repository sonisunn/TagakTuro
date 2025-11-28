package com.example.demo.model;

import jakarta.persistence.*;
import java.util.List;

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

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "availability_hours")
    private Integer availabilityHours;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean approved = false;

    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PAMAPreference> pamaPreferences;

    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PAMAAssignment> pamaAssignments;

    public Tutor() {}

    public Tutor(String name, String tutorId, String email, String phoneNumber) {
        this.name = name;
        this.tutorId = tutorId;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.active = true;
        this.approved = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTutorId() { return tutorId; }
    public void setTutorId(String tutorId) { this.tutorId = tutorId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public Integer getAvailabilityHours() { return availabilityHours; }
    public void setAvailabilityHours(Integer availabilityHours) { this.availabilityHours = availabilityHours; }

    public List<PAMAPreference> getPamaPreferences() { return pamaPreferences; }
    public void setPamaPreferences(List<PAMAPreference> pamaPreferences) { this.pamaPreferences = pamaPreferences; }

    public List<PAMAAssignment> getPamaAssignments() { return pamaAssignments; }
    public void setPamaAssignments(List<PAMAAssignment> pamaAssignments) { this.pamaAssignments = pamaAssignments; }

    // THESE METHODS ARE CRITICAL FOR FIXING THE ERROR
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean getApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
}