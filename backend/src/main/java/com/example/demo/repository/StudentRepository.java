package com.example.demo.repository;

import com.example.demo.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    // Find student by email
    Optional<Student> findByEmail(String email);

    // Find student by studentId
    Optional<Student> findByStudentId(String studentId);

<<<<<<< HEAD
    // Find student by user ID (for chat integration)
    Optional<Student> findByUserId(Long userId);

=======
>>>>>>> V3.23.2026
    // Check if email already exists
    boolean existsByEmail(String email);

    // Check if studentId already exists
    boolean existsByStudentId(String studentId);
}

