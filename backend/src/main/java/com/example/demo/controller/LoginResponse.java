package com.example.demo.controller;

import com.example.demo.model.User;

public class LoginResponse {
    private String token;
    private User user;
    private Long studentId;

    public LoginResponse() {}

    public LoginResponse(String token, User user, Long studentId) {
        this.token = token;
        this.user = user;
        this.studentId = studentId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
}
