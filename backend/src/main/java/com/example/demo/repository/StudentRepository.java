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

    // Check if email already exists
    boolean existsByEmail(String email);

    // Check if studentId already exists
    boolean existsByStudentId(String studentId);
}

