package com.example.demo;

<<<<<<< HEAD
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
=======
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
>>>>>>> V3.23.2026

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

<<<<<<< HEAD
=======
	@Bean
	CommandLineRunner initPasswords(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			for (User u : userRepository.findAll()) {
				u.setPassword(passwordEncoder.encode("admin123"));
				userRepository.save(u);
			}
			System.out.println(">>> TEMPORARY: FORCED ALL USER PASSWORDS TO 'admin123' <<<");
		};
	}
>>>>>>> V3.23.2026
}
