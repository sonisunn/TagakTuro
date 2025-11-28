package com.example.demo.dto;

public class ModuleCreateRequest {
    private String moduleName;
    private String description;
    private Integer capacity;

    // Getters
    public String getModuleName() {
        return moduleName;
    }

    public String getDescription() {
        return description;
    }

    public Integer getCapacity() {
        return capacity;
    }

    // Setters
    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
}