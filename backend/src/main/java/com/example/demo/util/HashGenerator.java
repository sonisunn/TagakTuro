package com.example.demo.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility class to generate BCrypt hashes for passwords.
 * Usage: Run this as a main method to generate hash for "TagakTuro2025"
 */
public class HashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "TagakTuro2025";
        String hashedPassword = encoder.encode(password);
        
        System.out.println("=".repeat(70));
        System.out.println("BCrypt Hash Generator for TagakTuro Admin Credentials");
        System.out.println("=".repeat(70));
        System.out.println("\nPassword: " + password);
        System.out.println("\nBCrypt Hash:");
        System.out.println(hashedPassword);
        System.out.println("\n" + "=".repeat(70));
        System.out.println("Copy the hash above and replace the placeholder in insert-admins.sql");
        System.out.println("=".repeat(70));
    }
}
