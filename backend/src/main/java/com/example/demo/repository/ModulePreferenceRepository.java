package com.example.demo.repository;

import com.example.demo.model.ModulePreference;
import com.example.demo.model.PAMAModule;
import com.example.demo.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ModulePreferenceRepository extends JpaRepository<ModulePreference, Long> {
    
    Optional<ModulePreference> findByTutorAndModule(Tutor tutor, PAMAModule module);
    
    List<ModulePreference> findByModule(PAMAModule module);
    
    List<ModulePreference> findByTutor(Tutor tutor);
    
    List<ModulePreference> findByAssignmentStatus(String status);
    
    List<ModulePreference> findByAssigned(Boolean assigned);
    
    List<ModulePreference> findByAssignmentStatusOrderByCompatibilityScoreDesc(String status);
}