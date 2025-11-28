package com.example.demo.dto;

import java.util.List;

public class PAMAExecuteRequest {
    private List<Long> moduleIds;

    // Getters
    public List<Long> getModuleIds() {
        return moduleIds;
    }

    // Setters
    public void setModuleIds(List<Long> moduleIds) {
        this.moduleIds = moduleIds;
    }
}