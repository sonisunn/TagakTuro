package com.example.demo.controller;

public class TutorApplicationRequest {
    private String name;
    private String studentId;
    private String courseProgram;
    private String email;
    private String phoneNumber;
    private String password;
    private String experience;
    private String timeAvailableStart;
    private String timeAvailableEnd;

    public TutorApplicationRequest(String name, String studentId, String courseProgram, String email, String phoneNumber, String password, String experience, String timeAvailableStart, String timeAvailableEnd) {
        this.name = name;
        this.studentId = studentId;
        this.courseProgram = courseProgram;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.password = password;
        this.experience = experience;
        this.timeAvailableStart = timeAvailableStart;
        this.timeAvailableEnd = timeAvailableEnd;
    }

    // Getters
    public String getName() { return name; }
    public String getStudentId() { return studentId; }
    public String getCourseProgram() { return courseProgram; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getPassword() { return password; }
    public String getExperience() { return experience; }
    public String getTimeAvailableStart() { return timeAvailableStart; }
    public String getTimeAvailableEnd() { return timeAvailableEnd; }
}
