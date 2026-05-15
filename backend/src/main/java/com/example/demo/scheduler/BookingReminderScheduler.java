package com.example.demo.scheduler;

import com.example.demo.model.Booking;
import com.example.demo.model.Evaluation;
import com.example.demo.model.Student;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.EvaluationRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(BookingReminderScheduler.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendSessionReminders() {
        LocalDateTime tomorrowStart = LocalDateTime.now().plusDays(1).toLocalDate().atStartOfDay();
        LocalDateTime tomorrowEnd = tomorrowStart.plusDays(1).minusSeconds(1);

        List<Booking> bookings = bookingRepository.findByBookingDateTimeBetween(tomorrowStart, tomorrowEnd);

        for (Booking booking : bookings) {
            if (booking.getStatus() == Booking.BookingStatus.CANCELLED) continue;
            if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) continue;

            String subject = booking.getSubject() != null ? booking.getSubject() : "tutoring";
            String tutorName = booking.getTutorName() != null ? booking.getTutorName() : "your tutor";
            String time = booking.getBookingDateTime().toLocalTime().toString();

            // Remind student
            try {
                Student student = booking.getStudent();
                if (student != null) {
                    User studentUser = student.getUser();
                    if (studentUser == null && student.getEmail() != null) {
                        studentUser = userRepository.findByEmail(student.getEmail()).orElse(null);
                    }
                    if (studentUser != null) {
                        notificationService.createNotification(studentUser,
                                "Session Reminder!",
                                "Hey! Just a reminder about your " + subject + " session with " + tutorName + " tomorrow at " + time + ".");
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to send reminder to student for booking " + booking.getId() + ": " + e.getMessage());
            }

            // Remind tutor
            try {
                if (booking.getTutorName() != null) {
                    tutorRepository.findByName(booking.getTutorName()).ifPresent(tutor -> {
                        if (tutor.getUser() != null) {
                            notificationService.createNotification(tutor.getUser(),
                                    "Session Reminder!",
                                    "Reminder: You have a " + subject + " session tomorrow at " + time + ".");
                        }
                    });
                }
            } catch (Exception e) {
                logger.error("Failed to send reminder to tutor for booking " + booking.getId() + ": " + e.getMessage());
            }
        }

        logger.info("Session reminders sent for " + bookings.size() + " bookings.");
    }

    /**
     * Marks CONFIRMED bookings as COMPLETED once their scheduled end time
     * (bookingDateTime + durationMinutes) has passed.
     *
     * Runs every 5 minutes. Bookings without a durationMinutes value default
     * to a 60-minute session for the purpose of this check.
     */
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void autoCompletePastBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> confirmed = bookingRepository.findByStatus(Booking.BookingStatus.CONFIRMED);

        int updated = 0;
        for (Booking booking : confirmed) {
            LocalDateTime start = booking.getBookingDateTime();
            if (start == null) continue;
            int duration = booking.getDurationMinutes() != null ? booking.getDurationMinutes() : 60;
            LocalDateTime end = start.plusMinutes(duration);
            if (end.isBefore(now)) {
                booking.setStatus(Booking.BookingStatus.COMPLETED);
                bookingRepository.save(booking);
                updated++;
            }
        }

        if (updated > 0) {
            logger.info("Auto-completed " + updated + " past bookings.");
        }
    }

    /**
     * Once a day, nudge anyone with a COMPLETED-but-unevaluated session
     * within the last 7 days to leave their evaluation. We only ping for the
     * sides that haven't submitted yet (student->tutor, tutor->student) and
     * we cap the lookback to 7 days so the queue doesn't keep growing.
     */
    @Scheduled(cron = "0 0 10 * * *")
    public void sendEvaluationReminders() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Booking> recentCompleted = bookingRepository.findByStatus(Booking.BookingStatus.COMPLETED)
                .stream()
                .filter(b -> b.getBookingDateTime() != null && b.getBookingDateTime().isAfter(sevenDaysAgo))
                .toList();

        int sent = 0;
        for (Booking booking : recentCompleted) {
            String subject = booking.getSubject() != null ? booking.getSubject() : "your session";

            // Student -> tutor evaluation
            try {
                if (!evaluationRepository.existsByBookingIdAndEvaluationType(
                        booking.getId(), Evaluation.EvaluationType.STUDENT_EVALUATES_TUTOR)) {
                    Student student = booking.getStudent();
                    if (student != null) {
                        User u = student.getUser();
                        if (u == null && student.getEmail() != null) {
                            u = userRepository.findByEmail(student.getEmail()).orElse(null);
                        }
                        if (u != null) {
                            String tutorName = booking.getTutorName() != null ? booking.getTutorName() : "your tutor";
                            notificationService.createNotification(u,
                                    "⭐ Don't forget to rate!",
                                    "How was your " + subject + " session with " + tutorName + "? Tap to leave a quick evaluation.");
                            sent++;
                        }
                    }
                }
            } catch (Exception e) {
                logger.error("Failed student eval reminder for booking " + booking.getId() + ": " + e.getMessage());
            }

            // Tutor -> student evaluation
            try {
                if (!evaluationRepository.existsByBookingIdAndEvaluationType(
                        booking.getId(), Evaluation.EvaluationType.TUTOR_EVALUATES_STUDENT)) {
                    if (booking.getTutorName() != null) {
                        tutorRepository.findByName(booking.getTutorName()).ifPresent(tutor -> {
                            if (tutor.getUser() != null) {
                                notificationService.createNotification(tutor.getUser(),
                                        "⭐ Don't forget to rate!",
                                        "Quick favour: leave an evaluation for your " + subject + " session so we can keep improving matches.");
                            }
                        });
                        sent++;
                    }
                }
            } catch (Exception e) {
                logger.error("Failed tutor eval reminder for booking " + booking.getId() + ": " + e.getMessage());
            }
        }

        if (sent > 0) {
            logger.info("Sent " + sent + " evaluation reminders.");
        }
    }
}
