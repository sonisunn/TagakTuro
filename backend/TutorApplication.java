package com.example.demo.tutor;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;

import java.time.LocalTime;

@Entity
public class TutorApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String studentId;
    private String courseProgram;
    private String email;
    private String phoneNumber;
    private String password; // Hashed password
    private LocalTime timeAvailableStart;
    private LocalTime timeAvailableEnd;
    @Lob
    private String experience;
    private String reportOfGradesPath;
    private String certificatesPath; // Optional

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
}