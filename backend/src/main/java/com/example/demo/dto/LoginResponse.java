package com.example.demo.dto;

import com.example.demo.model.User;

import java.util.Set;

public class LoginResponse {
    private String token;
    private User user;
    private Long studentId;
    private Long tutorId;
    private Set<String> roles;

    public LoginResponse() {}

    public LoginResponse(String token, User user, Long studentId, Long tutorId, Set<String> roles) {
        this.token = token;
        this.user = user;
        this.studentId = studentId;
        this.tutorId = tutorId;
        this.roles = roles;
    }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getTutorId() { return tutorId; }
    public void setTutorId(Long tutorId) { this.tutorId = tutorId; }
}
