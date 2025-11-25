package com.example.demo.repository;

import com.example.demo.model.TutorScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TutorScoreRepository extends JpaRepository<TutorScore, Long> {
    
    Optional<TutorScore> findByTutorId(Long tutorId);
    
    List<TutorScore> findByWeightedScoreGreaterThanEqual(BigDecimal score);
    
    List<TutorScore> findAllByOrderByWeightedScoreDesc();
    
    List<TutorScore> findByWeightedScoreBetween(BigDecimal minScore, BigDecimal maxScore);
}