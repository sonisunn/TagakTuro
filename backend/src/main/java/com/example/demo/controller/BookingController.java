package com.example.demo.controller;

import com.example.demo.model.Booking;
import com.example.demo.service.AutomatedMessageService;
import com.example.demo.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/booking")
@CrossOrigin(origins = "*")
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    private BookingService bookingService;

    @Autowired
    private AutomatedMessageService automatedMessageService;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bookingService.getBookingById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Booking>> getBookingsByStudentId(@PathVariable Long studentId) {
        return ResponseEntity.ok(bookingService.getBookingsByStudentId(studentId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Booking>> getBookingsByStatus(@PathVariable String status) {
        try {
            Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(bookingService.getBookingsByStatus(bookingStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<Booking>> getPendingBookings() {
        return ResponseEntity.ok(bookingService.getPendingBookings());
    }

    @GetMapping("/pending/tutor/{userId}")
    public ResponseEntity<List<Booking>> getPendingBookingsForTutor(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(bookingService.getPendingBookingsForTutor(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    @GetMapping("/tutor/{tutorName}")
    public ResponseEntity<List<Booking>> getBookingsByTutorName(@PathVariable String tutorName) {
        try {
            return ResponseEntity.ok(bookingService.getBookingsByTutorName(tutorName));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Booking>> getBookingsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(bookingService.getBookingsByDateRange(start, end));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            Booking created = bookingService.createBooking(booking);
            
            Map<String, Object> response = new HashMap<>();
            response.put("booking", created);
            response.put("message", "Booking created successfully. Automated greeting sent to student.");
            response.put("status", "success");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBooking(@PathVariable Long id, @RequestBody Booking booking) {
        try {
            Booking updated = bookingService.updateBooking(id, booking);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String statusStr = request.get("status");
        if (statusStr == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Status is required"));

        try {
            Booking.BookingStatus status = Booking.BookingStatus.valueOf(statusStr.toUpperCase());
            String cancellationReason = request.get("cancellationReason");
            Booking updatedBooking = bookingService.updateBookingStatus(id, status, cancellationReason);
            
            Map<String, Object> response = new HashMap<>();
            response.put("booking", updatedBooking);
            response.put("previousStatus", request.get("status"));
            response.put("newStatus", status.toString());
            response.put("message", "Booking status updated to " + status);
            
            if (status == Booking.BookingStatus.CONFIRMED) {
                response.put("automatedMessage", "Tutor greeting sent to student");
            }
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid status: " + statusStr));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        try {
            bookingService.deleteBooking(id);
            return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Decline a booking — reverts to PENDING and unassigns the tutor
     * POST /api/booking/{id}/decline
     */
    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineBooking(@PathVariable Long id) {
        try {
            Booking declined = bookingService.declineBooking(id);
            return ResponseEntity.ok(Map.of("message", "Booking reverted to pending", "booking", declined));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Confirm a booking and send automated tutor greeting message to student
     * POST /api/booking/{id}/confirm
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
        try {
            Booking confirmedBooking = bookingService.confirmBooking(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("booking", confirmedBooking);
            response.put("status", "CONFIRMED");
            response.put("message", "Booking confirmed successfully. Tutor greeting sent to student.");
            response.put("automatedMessage", "Welcome message and diagnostic test instruction sent");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Send diagnostic test instruction to student
     * POST /api/booking/{id}/send-diagnostic
     */
    @PostMapping("/{id}/send-diagnostic")
    public ResponseEntity<?> sendDiagnosticTest(@PathVariable Long id) {
        try {
            bookingService.sendDiagnosticTest(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Diagnostic test instruction sent to student");
            response.put("bookingId", id);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send diagnostic test: " + e.getMessage()));
        }
    }

    /**
     * Send study readiness confirmation from tutor
     * POST /api/booking/{id}/ready-for-study
     */
    @PostMapping("/{id}/ready-for-study")
    public ResponseEntity<?> readyForStudy(@PathVariable Long id, @RequestBody(required = false) Map<String, String> request) {
        try {
            Long conversationId = request != null && request.containsKey("conversationId") 
                    ? Long.parseLong(request.get("conversationId")) 
                    : null;
            
            Long tutorUserId = request != null && request.containsKey("tutorUserId") 
                    ? Long.parseLong(request.get("tutorUserId")) 
                    : null;
            
            if (tutorUserId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Tutor user ID is required"));
            }
            
            bookingService.readyForStudy(id, conversationId, tutorUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Study readiness message sent to student");
            response.put("bookingId", id);
            response.put("subject", bookingService.getBookingById(id).getSubject());
            
            return ResponseEntity.ok(response);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid ID format: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send readiness message: " + e.getMessage()));
        }
    }
}
