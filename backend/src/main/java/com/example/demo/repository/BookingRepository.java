package com.example.demo.repository;

import com.example.demo.model.Booking;
import com.example.demo.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Find all bookings for a specific student
    List<Booking> findByStudent(Student student);

    // Find all bookings for a student by student ID
    List<Booking> findByStudentId(Long studentId);

    // Find bookings by status
    List<Booking> findByStatus(Booking.BookingStatus status);

    // Find bookings within a date range
    List<Booking> findByBookingDateTimeBetween(LocalDateTime start, LocalDateTime end);

    // Find bookings by student and status
    List<Booking> findByStudentAndStatus(Student student, Booking.BookingStatus status);
    
    // Find bookings by tutor name
    List<Booking> findByTutorName(String tutorName);
    
    // Find bookings by tutor name and status
    List<Booking> findByTutorNameAndStatus(String tutorName, Booking.BookingStatus status);
}

