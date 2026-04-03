package com.example.demo;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	CommandLineRunner initPasswords(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			try {
				var users = userRepository.findAll();
				if (!users.isEmpty()) {
					for (User u : users) {
						u.setPassword(passwordEncoder.encode("admin123"));
						userRepository.save(u);
					}
					System.out.println(">>> TEMPORARY: FORCED ALL USER PASSWORDS TO 'admin123' <<<");
				}
			} catch (Exception e) {
				System.out.println(">>> Skip password initialization - no users found <<<");
			}
		};
	}
}
