package com.example.demo;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")      // Apply to ALL endpoints
            .allowedMethods("*")        // Allow all HTTP methods
            .allowedOriginPatterns("*") // CRUCIAL for dev: Allows requests from any IP
            .allowedHeaders("*");
    }
}