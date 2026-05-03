package com.example.demo.service;

import com.example.demo.dto.EvaluationRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.Evaluation;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.EvaluationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EvaluationService {

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Evaluation submitEvaluation(EvaluationRequest req) {
        Booking booking = bookingRepository.findById(req.getBookingId())
            .orElseThrow(() -> new RuntimeException("Booking not found: " + req.getBookingId()));

        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Evaluations can only be submitted for COMPLETED sessions.");
        }

        Evaluation.EvaluationType type = Evaluation.EvaluationType.valueOf(req.getEvaluationType());

        if (evaluationRepository.existsByBookingIdAndEvaluationType(req.getBookingId(), type)) {
            throw new RuntimeException("This session has already been evaluated.");
        }

        User evaluator = userRepository.findById(req.getEvaluatorId())
            .orElseThrow(() -> new RuntimeException("Evaluator not found: " + req.getEvaluatorId()));

        User evaluatee = userRepository.findById(req.getEvaluateeId())
            .orElseThrow(() -> new RuntimeException("Evaluatee not found: " + req.getEvaluateeId()));

        Evaluation evaluation = new Evaluation();
        evaluation.setBooking(booking);
        evaluation.setEvaluator(evaluator);
        evaluation.setEvaluatee(evaluatee);
        evaluation.setEvaluationType(type);
        evaluation.setQ1Answer(req.getQ1Answer());
        evaluation.setQ2Answer(req.getQ2Answer());
        evaluation.setQ3Answer(req.getQ3Answer());
        evaluation.setOpenComment(req.getOpenComment());

        return evaluationRepository.save(evaluation);
    }

    @Transactional(readOnly = true)
    public List<Evaluation> getEvaluationsForBooking(Long bookingId) {
        return evaluationRepository.findByBookingId(bookingId);
    }

    @Transactional(readOnly = true)
    public boolean hasEvaluated(Long bookingId, String type) {
        Evaluation.EvaluationType evalType = Evaluation.EvaluationType.valueOf(type);
        return evaluationRepository.existsByBookingIdAndEvaluationType(bookingId, evalType);
    }
}
