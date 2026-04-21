package com.example.demo.service;

import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.MessageDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.Student;
import com.example.demo.model.Tutor;
import com.example.demo.model.User;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AutomatedMessageService {

    @Autowired
    private ChatService chatService;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Send automated greeting message from tutor to student when matched/booked
     * This message introduces the tutor, subject, modality, and diagnostic test
     */
    /**
     * Resolve User for a Student - falls back to email lookup if not linked
     */
    private User resolveUserForStudent(Student student) {
        if (student == null) return null;
        if (student.getUser() != null) return student.getUser();
        // Fallback: find User by email for existing unlinked records
        return userRepository.findByEmail(student.getEmail()).orElse(null);
    }

    /**
     * Resolve User for a Tutor - falls back to email lookup if not linked
     */
    private User resolveUserForTutor(Tutor tutor) {
        if (tutor == null) return null;
        if (tutor.getUser() != null) return tutor.getUser();
        // Fallback: find User by email for existing unlinked records
        return userRepository.findByEmail(tutor.getEmail()).orElse(null);
    }

    public MessageDTO sendTutorGreetingMessage(Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
            
            // Get student and tutor information
            Student student = booking.getStudent();
            User studentUser = resolveUserForStudent(student);
            if (student == null || studentUser == null) {
                throw new RuntimeException("Student not found or not linked to user");
            }

            String tutorName = booking.getTutorName() != null ? booking.getTutorName() : "Your Tutor";
            String subject = booking.getSubject() != null ? booking.getSubject() : "Your Subject";
            String modality = booking.getModality() != null ? booking.getModality() : "Online";

            String greetingMessage = buildTutorGreetingMessage(tutorName, subject, modality);

            Tutor tutorEntity = findTutorForBooking(booking);
            User tutorUser = resolveUserForTutor(tutorEntity);
            
            if (tutorEntity == null || tutorUser == null) {
                // Even if tutor can't be found, still create notification for student
                notificationService.createNotification(
                        studentUser,
                        "Booking Confirmed!",
                        "Your booking for " + subject + " has been confirmed. A tutor has been assigned!"
                );
                throw new RuntimeException("Tutor not found or not linked to user (student notification sent)");
            }

            ConversationDTO conversation = chatService.getOrCreateConversation(
                    studentUser.getId(),
                    tutorUser.getId()
            );

            SendMessageRequest greetingRequest = new SendMessageRequest();
            greetingRequest.setConversationId(conversation.getId());
            greetingRequest.setContent(greetingMessage);
            greetingRequest.setMessageType("SYSTEM");

            MessageDTO messageDTO = chatService.sendMessage(
                    conversation.getId(),
                    tutorUser.getId(),
                    greetingRequest
            );

            // Create persistent Notifications
            notificationService.createNotification(
                    studentUser,
                    "Welcome to TagakTuro!",
                    "You have a matched tutor for " + subject + "! Check your messages to start."
            );

            notificationService.createNotification(
                    tutorUser,
                    "Booking Accepted!",
                    "You have successfully matched with " + student.getName() + " for " + subject + "."
            );

            return messageDTO;
        } catch (Exception e) {
            throw new RuntimeException("Failed to send tutor greeting message: " + e.getMessage());
        }
    }

    /**
     * Send custom system message between tutor and student
     */
    public MessageDTO sendSystemMessage(Long conversationId, Long senderUserId, String messageContent) {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(conversationId);
        request.setContent(messageContent);
        request.setMessageType("SYSTEM");

        return chatService.sendMessage(conversationId, senderUserId, request);
    }

    /**
     * Send diagnostic test instruction message
     */
    public MessageDTO sendDiagnosticTestMessage(Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

            Student student = booking.getStudent();
            User studentUser = resolveUserForStudent(student);
            if (student == null || studentUser == null) {
                throw new RuntimeException("Student not found or not linked to user");
            }

            Tutor tutorEntity = findTutorForBooking(booking);
            User tutorUser = resolveUserForTutor(tutorEntity);
            if (tutorEntity == null || tutorUser == null) {
                throw new RuntimeException("Tutor not found or not linked to user");
            }

            ConversationDTO conversation = chatService.getOrCreateConversation(
                    studentUser.getId(),
                    tutorUser.getId()
            );

            String diagnosticMessage = "Please complete the Diagnostic Test to help us assess your current knowledge level in " 
                    + booking.getSubject() + ". This will help me tailor the lessons to your needs.";

            notificationService.createNotification(
                    studentUser,
                    "Pending Diagnostic Test",
                    "Your diagnostic test for " + booking.getSubject() + " is ready. Please complete it."
            );

            return sendSystemMessage(
                    conversation.getId(),
                    tutorUser.getId(),
                    diagnosticMessage
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to send diagnostic test message: " + e.getMessage());
        }
    }

    /**
     * Send study session readiness message
     */
    public MessageDTO sendStudyReadinessMessage(Long conversationId, Long tutorUserId, String subject) {
        String message = "I'm looking forward to our study session on " + subject + "! " +
                "I'm ready to help you understand the concepts and excel in your coursework.";
        
        return sendSystemMessage(conversationId, tutorUserId, message);
    }

    // Helper Methods

    /**
     * Build formatted greeting message from tutor to student
     */
    private String buildTutorGreetingMessage(String tutorName, String subject, String modality) {
        return "Hello! I am " + tutorName + ", your matched tutor for " + subject + 
               ", and your preferred modality is " + modality + 
               ".\n\nKindly answer the Diagnostic Test so we can assess your current knowledge.\n\n" +
               "📋 Diagnostic Test\n\n" +
               "I'm looking forward to a swift study session with you!";
    }

    /**
     * Find tutor entity from booking
     * This method needs to be enhanced based on how tutor info is stored in Booking
     */
    private Tutor findTutorForBooking(Booking booking) {
        // Attempt 1: If booking has direct tutor reference
        // (This depends on your Booking model structure)
        
        // Attempt 2: Search by tutor name
        if (booking.getTutorName() != null && !booking.getTutorName().isEmpty()) {
            return tutorRepository.findAll().stream()
                    .filter(t -> t.getName().equalsIgnoreCase(booking.getTutorName()))
                    .findFirst()
                    .orElse(null);
        }

        // If no tutor found, return null
        return null;
    }

    /**
     * Template for custom message
     */
    public static class MessageTemplate {
        private String subject;
        private String tutorName;
        private String modality;
        private String additionalNotes;

        public MessageTemplate(String subject, String tutorName, String modality) {
            this.subject = subject;
            this.tutorName = tutorName;
            this.modality = modality;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getTutorName() {
            return tutorName;
        }

        public void setTutorName(String tutorName) {
            this.tutorName = tutorName;
        }

        public String getModality() {
            return modality;
        }

        public void setModality(String modality) {
            this.modality = modality;
        }

        public String getAdditionalNotes() {
            return additionalNotes;
        }

        public void setAdditionalNotes(String additionalNotes) {
            this.additionalNotes = additionalNotes;
        }
    }
}
