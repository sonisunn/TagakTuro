package com.example.demo.repository;

import com.example.demo.model.TutorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutorAvailabilityRepository extends JpaRepository<TutorAvailability, Long> {
    List<TutorAvailability> findByTutorId(Long tutorId);
    void deleteByTutorId(Long tutorId);
}
