package com.example.demo.service;

import com.example.demo.model.Booking;
import com.example.demo.model.Student;
import com.example.demo.model.Tutor;
import com.example.demo.model.TutorAvailability;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.time.ZoneId;
import java.time.ZoneOffset;

@Service
public class BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AutomatedMessageService automatedMessageService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TutorRepository tutorRepository;

    private Booking enrichBookingWithUserIds(Booking booking) {
        if (booking == null) return null;
        
        // Student User ID
        if (booking.getStudent() != null) {
            User studentUser = booking.getStudent().getUser();
            if (studentUser == null) {
                userRepository.findByEmail(booking.getStudent().getEmail()).ifPresent(user -> booking.setStudentUserId(user.getId()));
            } else {
                booking.setStudentUserId(studentUser.getId());
            }
        }
        
        // Tutor User ID
        if (booking.getTutorName() != null && !booking.getTutorName().isEmpty()) {
            tutorRepository.findByName(booking.getTutorName()).ifPresent(tutor -> {
                if (tutor.getUser() != null) {
                    booking.setTutorUserId(tutor.getUser().getId());
                } else {
                    userRepository.findByEmail(tutor.getEmail()).ifPresent(user -> booking.setTutorUserId(user.getId()));
                }
            });
        }
        return booking;
    }

    private List<Booking> enrichBookingsWithUserIds(List<Booking> bookings) {
        if (bookings == null) return null;
        return bookings.stream().map(this::enrichBookingWithUserIds).collect(java.util.stream.Collectors.toList());
    }

    // Get all bookings
    public List<Booking> getAllBookings() {
        return enrichBookingsWithUserIds(bookingRepository.findAll());
    }

    // Get booking by ID
    public Booking getBookingById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Booking ID cannot be null");
        }
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
        return enrichBookingWithUserIds(booking);
    }

    // Get all bookings for a specific student
    public List<Booking> getBookingsByStudentId(Long studentId) {
        if (studentId == null) {
            throw new IllegalArgumentException("Student ID cannot be null");
        }
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        return enrichBookingsWithUserIds(bookingRepository.findByStudent(student));
    }

    // Get bookings by status
    public List<Booking> getBookingsByStatus(Booking.BookingStatus status) {
        return enrichBookingsWithUserIds(bookingRepository.findByStatus(status));
    }

    // Get all pending bookings (for tutors to see all available bookings)
    public List<Booking> getPendingBookings() {
        return enrichBookingsWithUserIds(bookingRepository.findByStatus(Booking.BookingStatus.PENDING));
    }
    @Transactional(readOnly = true)
    public List<Booking> getPendingBookingsForTutor(Long tutorUserId) {
        List<Booking> allPending = getPendingBookings();
        Tutor tutor = tutorRepository.findByUser_Id(tutorUserId)
                .orElseThrow(() -> new RuntimeException("Tutor not found with userId: " + tutorUserId));

        List<TutorAvailability> availabilities = tutor.getAvailabilities();

        if (availabilities == null || availabilities.isEmpty()) {
            return allPending;
        }

        return allPending.stream().filter(booking -> {
            if (booking.getBookingDateTime() == null || booking.getDurationMinutes() == null) {
                return false;
            }
            
            LocalDateTime start = booking.getBookingDateTime();
            LocalDateTime end = start.plusMinutes(booking.getDurationMinutes());
            
            // Map Java DayOfWeek (1=Mon...7=Sun) to JS format (0=Sun...6=Sat)
            int javaDayOfWeek = start.getDayOfWeek().getValue();
            int jsDayOfWeek = javaDayOfWeek == 7 ? 0 : javaDayOfWeek;

            LocalTime bStart = start.toLocalTime();
            LocalTime bEnd = end.toLocalTime();

            return availabilities.stream().anyMatch(avail -> {
                if (avail.getDayOfWeek() != jsDayOfWeek) {
                    return false;
                }
                boolean startsAfterOrAt = !bStart.isBefore(avail.getStartTime());
                boolean endsBeforeOrAt = !bEnd.isAfter(avail.getEndTime());
                return startsAfterOrAt && endsBeforeOrAt;
            });
        }).collect(java.util.stream.Collectors.toList());
    }
    // Get bookings by tutor name
    public List<Booking> getBookingsByTutorName(String tutorName) {
        if (tutorName == null || tutorName.isEmpty()) {
            throw new IllegalArgumentException("Tutor name cannot be null or empty");
        }
        return enrichBookingsWithUserIds(bookingRepository.findByTutorName(tutorName));
    }

    // Get bookings within a date range
    public List<Booking> getBookingsByDateRange(LocalDateTime start, LocalDateTime end) {
        return enrichBookingsWithUserIds(bookingRepository.findByBookingDateTimeBetween(start, end));
    }

    // Create a new booking
    public Booking createBooking(Booking booking) {
        // Validate that student exists
        if (booking == null) {
            throw new IllegalArgumentException("Booking cannot be null");
        }
        if (booking.getStudent() == null || booking.getStudent().getId() == null) {
            throw new IllegalArgumentException("Student is required for booking");
        }

        Long studentId = booking.getStudent().getId();
        @SuppressWarnings("null")
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException(
                        "Student not found with id: " + studentId + ". Please log in again to refresh your session."));

        booking.setStudent(student);

        // Validate booking date is in the future
        if (booking.getBookingDateTime() != null && booking.getBookingDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Booking date cannot be in the past");
        }

        if (booking.getModality() == null || booking.getModality().isEmpty()) {
            throw new IllegalArgumentException("Modality is required for booking");
        }

        // Validate venue is required for in-person bookings
        if ("In-Person".equals(booking.getModality()) && (booking.getVenue() == null || booking.getVenue().isEmpty())) {
            throw new IllegalArgumentException("Venue is required for in-person bookings");
        }

        // Check for booking conflicts (overlapping time ranges)
        if (booking.getBookingDateTime() != null && booking.getDurationMinutes() != null) {
            LocalDateTime bookingStart = booking.getBookingDateTime();
            LocalDateTime bookingEnd = bookingStart.plusMinutes(booking.getDurationMinutes());

            // Get all existing bookings for the same date
            LocalDateTime dayStart = bookingStart.toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = bookingStart.toLocalDate().atTime(23, 59, 59);

            List<Booking> existingBookings = bookingRepository.findByBookingDateTimeBetween(dayStart, dayEnd);

            // Check for overlaps with existing bookings (excluding cancelled ones)
            for (Booking existing : existingBookings) {
                if (existing.getStatus() == Booking.BookingStatus.CANCELLED) {
                    continue; // Skip cancelled bookings
                }

                if (existing.getBookingDateTime() != null && existing.getDurationMinutes() != null) {
                    LocalDateTime existingStart = existing.getBookingDateTime();
                    LocalDateTime existingEnd = existingStart.plusMinutes(existing.getDurationMinutes());

                    // Check if time ranges overlap
                    // Overlap occurs if: newStart < existingEnd AND newEnd > existingStart
                    if (bookingStart.isBefore(existingEnd) && bookingEnd.isAfter(existingStart)) {
                        throw new IllegalArgumentException(
                                "The selected time overlaps with an existing booking. Please choose a different time.");
                    }
                }
            }
        }

        Booking savedBooking = bookingRepository.save(booking);

        // Send automated tutor greeting when booking is created
        try {
            automatedMessageService.sendTutorGreetingMessage(savedBooking.getId());
            logger.info("Automated tutor greeting sent for booking ID: " + savedBooking.getId());
        } catch (Exception e) {
            logger.warn("Failed to send automated greeting for booking ID " + savedBooking.getId() + ": " + e.getMessage());
            // Don't fail the booking creation if message sending fails
        }

        return savedBooking;
    }

    // Update an existing booking
    @SuppressWarnings("null")
    public Booking updateBooking(Long id, Booking bookingDetails) {
        Booking booking = getBookingById(id);

        // Update fields if provided
        if (bookingDetails.getSubject() != null) {
            booking.setSubject(bookingDetails.getSubject());
        }
        if (bookingDetails.getBookingDateTime() != null) {
            // Validate booking date is in the future
            if (bookingDetails.getBookingDateTime().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("Booking date cannot be in the past");
            }
            booking.setBookingDateTime(bookingDetails.getBookingDateTime());
        }
        if (bookingDetails.getStatus() != null) {
            booking.setStatus(bookingDetails.getStatus());
        }
        if (bookingDetails.getTutorName() != null) {
            booking.setTutorName(bookingDetails.getTutorName());
        }
        if (bookingDetails.getNotes() != null) {
            booking.setNotes(bookingDetails.getNotes());
        }
        if (bookingDetails.getDurationMinutes() != null) {
            booking.setDurationMinutes(bookingDetails.getDurationMinutes());
        }
        if (bookingDetails.getModality() != null) {
            booking.setModality(bookingDetails.getModality());
        }
        // Update student if provided and different
        if (bookingDetails.getStudent() != null && bookingDetails.getStudent().getId() != null &&
                !bookingDetails.getStudent().getId().equals(booking.getStudent().getId())) {
            Long newStudentId = bookingDetails.getStudent().getId();
            @SuppressWarnings("null")
            Student newStudent = studentRepository.findById(newStudentId)
                    .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + newStudentId));
            booking.setStudent(newStudent);
        }

        return bookingRepository.save(booking);
    }

    // Update booking status
    @SuppressWarnings("null")
    public Booking updateBookingStatus(Long id, Booking.BookingStatus status) {
        if (id == null) {
            throw new IllegalArgumentException("Booking ID cannot be null");
        }
        if (status == null) {
            throw new IllegalArgumentException("Booking status cannot be null");
        }
        @SuppressWarnings("null")
        Booking booking = getBookingById(id);
        booking.setStatus(status);
        Booking savedBooking = bookingRepository.save(booking);

        // Send automated messages based on status change
        if (status == Booking.BookingStatus.CONFIRMED) {
            try {
                automatedMessageService.sendTutorGreetingMessage(savedBooking.getId());
                logger.info("Automated tutor greeting sent for confirmed booking ID: " + id);
            } catch (Exception e) {
                logger.warn("Failed to send greeting for booking ID " + id + ": " + e.getMessage());
                // Fallback: create notification directly for the student
                try {
                    Student student = savedBooking.getStudent();
                    if (student != null) {
                        User studentUser = student.getUser();
                        // Fallback to email lookup for unlinked students
                        if (studentUser == null && student.getEmail() != null) {
                            studentUser = userRepository.findByEmail(student.getEmail()).orElse(null);
                        }
                        if (studentUser != null) {
                            notificationService.createNotification(
                                    studentUser,
                                    "Booking Confirmed!",
                                    "Your booking for " + (savedBooking.getSubject() != null ? savedBooking.getSubject() : "your subject") + " has been confirmed. Check your messages!"
                            );
                            logger.info("Fallback notification sent for booking ID: " + id);
                        } else {
                            logger.warn("Could not find user for student email: " + student.getEmail());
                        }
                    }
                } catch (Exception fallbackEx) {
                    logger.error("Failed to send fallback notification for booking ID " + id + ": " + fallbackEx.getMessage());
                }
            }
        }

        return savedBooking;
    }

    // Delete a booking
    @SuppressWarnings("null")
    public void deleteBooking(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Booking ID cannot be null");
        }
        @SuppressWarnings("null")
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }

    // Confirm booking
    public Booking confirmBooking(Long id) {
        return updateBookingStatus(id, Booking.BookingStatus.CONFIRMED);
    }

    // Send diagnostic test
    public void sendDiagnosticTest(Long id) {
        Booking booking = getBookingById(id);
        automatedMessageService.sendDiagnosticTestMessage(booking.getId());
    }

    // Send study readiness message
    public void readyForStudy(Long id, Long conversationId, Long tutorUserId) {
        Booking booking = getBookingById(id);
        if (booking.getStudent() == null || booking.getStudent().getUser() == null) {
            throw new IllegalArgumentException("Student not found or not linked to user");
        }
        automatedMessageService.sendStudyReadinessMessage(
                conversationId != null ? conversationId : 1L,
                tutorUserId,
                booking.getSubject()
        );
    }
}
