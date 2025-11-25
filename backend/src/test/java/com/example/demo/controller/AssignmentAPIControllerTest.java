package com.example.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AssignmentAPIControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testHybridMatchingEndpoint() throws Exception {
        mockMvc.perform(post("/api/v1/assignments/hybrid/match")
            .contentType("application/json")
            .content("{}"))
            .andExpect(status().isOk());
    }

    @Test
    public void testScoringEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/scores/tutor/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").exists());
    }

    @Test
    public void testDeadlockDetectionEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/deadlock/detect"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    public void testOptimizationEndpoint() throws Exception {
        mockMvc.perform(post("/api/v1/assignments/optimize?iterations=3"))
            .andExpect(status().isOk());
    }

    @Test
    public void testAssignmentStatusEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    public void testPendingAssignmentsEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/pending"))
            .andExpect(status().isOk());
    }

    @Test
    public void testOptimizationReportEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/optimization-report"))
            .andExpect(status().isOk());
    }
}