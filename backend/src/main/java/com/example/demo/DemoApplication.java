package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	CommandLineRunner initAdminCredentials(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			try {
				// Credentials are sourced from environment variables only.
				// Do not hardcode sensitive values in source.
				upsertAdminFromEnv(
						userRepository,
						passwordEncoder,
						"OVPSSCD_ADMIN_EMAIL",
						"OVPSSCD_ADMIN_PASSWORD",
						"ROLE_ADMIN",
						"Admin",
						"OVPSSCD001");

				upsertAdminFromEnv(
						userRepository,
						passwordEncoder,
						"CCED_ADMIN_EMAIL",
						"CCED_ADMIN_PASSWORD",
						"ROLE_CCED",
						"CCED Admin",
						"CCED001");
			} catch (Exception e) {
				System.out.println(">>> Admin credential initialization skipped: " + e.getMessage() + " <<<");
			}
		};
	}

	private void upsertAdminFromEnv(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			String emailEnvKey,
			String passwordEnvKey,
			String role,
			String defaultName,
			String defaultStudentId) {

		String email = System.getenv(emailEnvKey);
		String password = System.getenv(passwordEnvKey);

		if (isBlank(email) || isBlank(password)) {
			System.out.println(">>> Missing env vars: " + emailEnvKey + " / " + passwordEnvKey + " (skipped) <<<");
			return;
		}

		Optional<User> existing = userRepository.findByEmail(email.trim());
		User user = existing.orElseGet(User::new);

		if (isBlank(user.getName())) user.setName(defaultName);
		if (isBlank(user.getStudentId())) user.setStudentId(defaultStudentId);
		if (isBlank(user.getCourseProgram())) user.setCourseProgram("N/A");
		if (isBlank(user.getPhoneNumber())) user.setPhoneNumber("0000000000");

		user.setEmail(email.trim());
		user.setPassword(passwordEncoder.encode(password));

		Set<String> roles = user.getRoles() == null ? new HashSet<>() : new HashSet<>(user.getRoles());
		roles.add(role);
		user.setRoles(roles);

		userRepository.save(user);
		System.out.println(">>> Initialized admin account from env: " + emailEnvKey + " <<<");
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
