package com.example.demo.repository;

import com.example.demo.model.PAMAAssignment;
import com.example.demo.model.Module;
import com.example.demo.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PAMAAssignmentRepository extends JpaRepository<PAMAAssignment, Long> {
    
    // Existing methods using Entity objects
    List<PAMAAssignment> findByTutor(Tutor tutor);
    List<PAMAAssignment> findByModule(Module module);
    List<PAMAAssignment> findByStatus(PAMAAssignment.AssignmentStatus status);
    List<PAMAAssignment> findByRoundNumber(Integer roundNumber);
    Optional<PAMAAssignment> findByTutorAndModule(Tutor tutor, Module module);

    // FIX: Added ID-based methods to satisfy PAMAService calls
    List<PAMAAssignment> findByModuleId(Long moduleId);
    List<PAMAAssignment> findByTutorId(Long tutorId);
}