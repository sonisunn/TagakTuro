package com.example.demo.service;

import com.example.demo.model.Booking;
import com.example.demo.model.Student;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private StudentRepository studentRepository;

    // Get all bookings
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Get booking by ID
    public Booking getBookingById(Long id) {
        if (id == null) {
            throw new RuntimeException("Booking ID cannot be null");
        }
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    // Get all bookings for a specific student
    public List<Booking> getBookingsByStudentId(Long studentId) {
        if (studentId == null) {
            throw new RuntimeException("Student ID cannot be null");
        }
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        return bookingRepository.findByStudent(student);
    }

    // Get bookings by status
    public List<Booking> getBookingsByStatus(Booking.BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    // Get bookings within a date range
    public List<Booking> getBookingsByDateRange(LocalDateTime start, LocalDateTime end) {
        return bookingRepository.findByBookingDateTimeBetween(start, end);
    }

    // Create a new booking
    public Booking createBooking(Booking booking) {
        // Validate that student exists
        if (booking == null) {
            throw new RuntimeException("Booking cannot be null");
        }
        if (booking.getStudent() == null || booking.getStudent().getId() == null) {
            throw new RuntimeException("Student is required for booking");
        }

        Long studentId = booking.getStudent().getId();
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        booking.setStudent(student);

        // Validate booking date is in the future
        if (booking.getBookingDateTime() != null && booking.getBookingDateTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Booking date cannot be in the past");
        }

        return bookingRepository.save(booking);
    }

    // Update an existing booking
    public Booking updateBooking(Long id, Booking bookingDetails) {
        Booking booking = getBookingById(id);

        // Update fields if provided
        if (bookingDetails.getSubject() != null) {
            booking.setSubject(bookingDetails.getSubject());
        }
        if (bookingDetails.getBookingDateTime() != null) {
            // Validate booking date is in the future
            if (bookingDetails.getBookingDateTime().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Booking date cannot be in the past");
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

        return bookingRepository.save(booking);
    }

    // Update booking status
    public Booking updateBookingStatus(Long id, Booking.BookingStatus status) {
        if (id == null) {
            throw new RuntimeException("Booking ID cannot be null");
        }
        if (status == null) {
            throw new RuntimeException("Booking status cannot be null");
        }
        Booking booking = getBookingById(id);
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    // Delete a booking
    public void deleteBooking(Long id) {
        if (id == null) {
            throw new RuntimeException("Booking ID cannot be null");
        }
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }
}

