package com.example.demo.scheduler;

import com.example.demo.model.Booking;
import com.example.demo.model.Student;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
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
}
