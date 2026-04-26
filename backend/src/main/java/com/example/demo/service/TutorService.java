package com.example.demo.service;

import com.example.demo.model.Tutor;
import com.example.demo.model.Booking;
import com.example.demo.model.Feedback;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.FeedbackRepository;
import com.example.demo.repository.TutorAvailabilityRepository;
import com.example.demo.model.TutorAvailability;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TutorService {

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private TutorAvailabilityRepository tutorAvailabilityRepository;

    @Autowired
    private EmailService emailService;

    // Get all tutors with live statistics
    public List<Tutor> getAllTutors() {
        List<Tutor> tutors = tutorRepository.findAll();
        for (Tutor tutor : tutors) {
            enrichTutorStats(tutor);
        }
        return tutors;
    }

    private void enrichTutorStats(Tutor tutor) {
        // 1. Count completed sessions
        List<Booking> completedBookings = bookingRepository.findByTutorNameAndStatus(tutor.getName(), Booking.BookingStatus.COMPLETED);
        tutor.setSessionsDone(completedBookings.size());

        // 2. Calculate total hours
        double totalMinutes = completedBookings.stream()
                .mapToDouble(b -> b.getDurationMinutes() != null ? b.getDurationMinutes() : 0.0)
                .sum();
        tutor.setTotalHours(totalMinutes / 60.0);

        // 3. Calculate average rating
        // Note: feedbacks are linked to the User ID of the tutor
        if (tutor.getUser() != null) {
            List<Feedback> feedbacks = feedbackRepository.findByRevieweeId(tutor.getUser().getId());
            if (!feedbacks.isEmpty()) {
                double avgRating = feedbacks.stream()
                        .mapToDouble(Feedback::getRating)
                        .average()
                        .orElse(0.0);
                tutor.setRating(avgRating);
            }
        }
    }

    // Get tutor by ID
    public Tutor getTutorById(Long id) {
        if (id == null) {
            throw new RuntimeException("Tutor ID cannot be null");
        }
        Tutor tutor = tutorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tutor not found with id: " + id));
        enrichTutorStats(tutor);
        return tutor;
    }

    // Get tutor by email
    public Tutor getTutorByEmail(String email) {
        Tutor tutor = tutorRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tutor not found with email: " + email));
        enrichTutorStats(tutor);
        return tutor;
    }

    // Get tutor by userId
    public Tutor getTutorByUserId(Long userId) {
        Tutor tutor = tutorRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("Tutor not found with userId: " + userId));
        enrichTutorStats(tutor);
        return tutor;
    }

    public Tutor issueCertificate(Long id) {
        Tutor tutor = getTutorById(id);
        tutor.setIsCertIssued(true);
        Tutor saved = tutorRepository.save(tutor);
        
        // Notify via email
        emailService.sendCertificateEmail(
            tutor.getEmail(), 
            tutor.getName(), 
            tutor.getTotalHours(), 
            tutor.getRating()
        );
        
        return saved;
    }

    // Delete a tutor
    public void deleteTutor(Long id) {
        if (id == null) {
            throw new RuntimeException("Tutor ID cannot be null");
        }
        Tutor tutor = getTutorById(id);
        tutorRepository.delete(tutor);
    }

    public List<TutorAvailability> getAvailabilityByUserId(Long userId) {
        Tutor tutor = getTutorByUserId(userId);
        return tutor.getAvailabilities();
    }

    public List<TutorAvailability> updateAvailabilityByUserId(Long userId, List<TutorAvailability> availabilities) {
        Tutor tutor = getTutorByUserId(userId);
        tutorAvailabilityRepository.deleteByTutorId(tutor.getId());
        tutor.getAvailabilities().clear();
        if (availabilities != null) {
            for (TutorAvailability a : availabilities) {
                a.setTutor(tutor);
                tutor.getAvailabilities().add(a);
            }
        }
        tutorRepository.save(tutor);
        return tutor.getAvailabilities();
    }
}
