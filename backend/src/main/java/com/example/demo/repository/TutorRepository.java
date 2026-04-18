package com.example.demo.repository;

import com.example.demo.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long> {
    // Find tutor by email
    Optional<Tutor> findByEmail(String email);

    // Find tutor by user ID (for chat integration)
    Optional<Tutor> findByUserId(Long userId);

    // Check if email already exists
    boolean existsByEmail(String email);

    boolean existsByTutorId(String tutorId);

    // Find tutor by name (for feedback correlation)
    Optional<Tutor> findByName(String name);
}
