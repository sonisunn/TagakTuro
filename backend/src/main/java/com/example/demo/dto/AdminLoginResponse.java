package com.example.demo.dto;

import com.example.demo.model.User;

import java.util.Set;

public class AdminLoginResponse {
    private String token;
    private User user;
    private Set<String> roles;
    private String portal;

    public AdminLoginResponse(String token, User user, Set<String> roles, String portal) {
        this.token = token;
        this.user = user;
        this.roles = roles;
        this.portal = portal;
    }

    public String getToken() {
        return token;
    }

    public User getUser() {
        return user;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public String getPortal() {
        return portal;
    }
}
