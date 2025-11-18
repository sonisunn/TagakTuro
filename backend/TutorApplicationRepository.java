package com.example.demo.tutor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TutorApplicationRepository extends JpaRepository<TutorApplication, Long> {
    Optional<TutorApplication> findByEmail(String email);
}