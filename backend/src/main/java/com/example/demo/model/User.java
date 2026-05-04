package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(nullable = false)
    private String studentId;
    @Column(nullable = false)
    private String courseProgram;
    @Column(nullable = false, unique = true)
    private String email;
    private String phoneNumber;
    @Column(nullable = false)
    // allow JSON write (deserialization) but prevent sending the password back in responses
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Lob
    @Column(name = "profile_picture_url", columnDefinition = "LONGTEXT")
    private String profilePictureUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private java.util.Set<String> roles;

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getCourseProgram() { return courseProgram; }
    public void setCourseProgram(String courseProgram) { this.courseProgram = courseProgram; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public java.util.Set<String> getRoles() { return roles; }
    public void setRoles(java.util.Set<String> roles) { this.roles = roles; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
}
