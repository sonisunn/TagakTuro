package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api") // Base mapping
public class TestController {
    @GetMapping("/hello") // Method mapping
    public String getGreeting() {
        return "Hello from Spring Boot!";
    }
}