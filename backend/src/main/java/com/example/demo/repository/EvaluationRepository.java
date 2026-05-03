package com.example.demo.repository;

import com.example.demo.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByBookingId(Long bookingId);
    List<Evaluation> findByEvaluatorId(Long evaluatorId);
    List<Evaluation> findByEvaluateeId(Long evaluateeId);
    boolean existsByBookingIdAndEvaluationType(Long bookingId, Evaluation.EvaluationType evaluationType);
}
