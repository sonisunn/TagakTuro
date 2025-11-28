package com.example.demo.repository;

import com.example.demo.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long> {
    // Find tutor by email
    Optional<Tutor> findByEmail(String email);

    // Check if email already exists
    boolean existsByEmail(String email);

    boolean existsByTutorId(String tutorId);
}
