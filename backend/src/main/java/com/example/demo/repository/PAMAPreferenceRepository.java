package com.example.demo.repository;

import com.example.demo.model.PAMAPreference;
import com.example.demo.model.Module;
import com.example.demo.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PAMAPreferenceRepository extends JpaRepository<PAMAPreference, Long> {
    List<PAMAPreference> findByTutor(Tutor tutor);
    List<PAMAPreference> findByModule(Module module);
    List<PAMAPreference> findByModuleOrderByScoreDesc(Module module);
    List<PAMAPreference> findByTutorOrderByPreferenceRankAsc(Tutor tutor);
    Optional<PAMAPreference> findByTutorAndModule(Tutor tutor, Module module);
}