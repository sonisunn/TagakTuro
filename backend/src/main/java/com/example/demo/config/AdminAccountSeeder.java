package com.example.demo.config;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class AdminAccountSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        final String adminEmail = "adminOVPSSCD@umak.edu.ph";
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }

        User adminUser = new User();
        adminUser.setName("OVPSSCD Admin");
        adminUser.setEmail(adminEmail);
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setStudentId("OVPSSCD-ADMIN");
        adminUser.setCourseProgram("ADMINISTRATION");
        adminUser.setPhoneNumber("N/A");
        adminUser.setRoles(Set.of("ROLE_ADMIN"));

        userRepository.save(adminUser);
    }
}
