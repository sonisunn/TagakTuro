package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "tutor_applications")
public class TutorApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "student_id", nullable = false, unique = true)
    private String studentId;

    @Column(name = "course_program", nullable = false)
    private String courseProgram;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String password; // Hashed password

    @Column(name = "time_available_start", nullable = false)
    private LocalTime timeAvailableStart;

    @Column(name = "time_available_end", nullable = false)
    private LocalTime timeAvailableEnd;

    @Column(name = "experience", columnDefinition = "TEXT", nullable = false)
    private String experience;

    @Column(name = "report_of_grades_path", nullable = false)
    private String reportOfGradesPath;

    @Column(name = "certificates_path")
    private String certificatesPath; // Optional

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

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

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getCourseProgram() {
        return courseProgram;
    }

    public void setCourseProgram(String courseProgram) {
        this.courseProgram = courseProgram;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalTime getTimeAvailableStart() {
        return timeAvailableStart;
    }

    public void setTimeAvailableStart(LocalTime timeAvailableStart) {
        this.timeAvailableStart = timeAvailableStart;
    }

    public LocalTime getTimeAvailableEnd() {
        return timeAvailableEnd;
    }

    public void setTimeAvailableEnd(LocalTime timeAvailableEnd) {
        this.timeAvailableEnd = timeAvailableEnd;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getReportOfGradesPath() { return reportOfGradesPath; }

    public void setReportOfGradesPath(String reportOfGradesPath) { this.reportOfGradesPath = reportOfGradesPath; }

    public String getCertificatesPath() { return certificatesPath; }

    public void setCertificatesPath(String certificatesPath) { this.certificatesPath = certificatesPath; }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}