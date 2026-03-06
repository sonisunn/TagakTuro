package com.example.demo.service;

import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.MessageDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.Student;
import com.example.demo.model.Tutor;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AutomatedMessageService {

    @Autowired
    private ChatService chatService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    /**
     * Send automated greeting message from tutor to student when matched/booked
     * This message introduces the tutor, subject, modality, and diagnostic test
     */
    public MessageDTO sendTutorGreetingMessage(Booking booking) {
        try {
            // Get student and tutor information
            Student student = booking.getStudent();
            if (student == null || student.getUser() == null) {
                throw new RuntimeException("Student not found or not linked to user");
            }

            // Get tutor by ID (assuming booking has tutor_name or tutorId)
            // For now, we'll need to enhance this based on your Booking model
            String tutorName = booking.getTutorName() != null ? booking.getTutorName() : "Your Tutor";
            String subject = booking.getSubject() != null ? booking.getSubject() : "Your Subject";
            String modality = booking.getModality() != null ? booking.getModality() : "Online";

            // Build the automated greeting message
            String greetingMessage = buildTutorGreetingMessage(tutorName, subject, modality);

            // Get or create conversation
            // We need student and tutor user IDs - we'll try to find tutor by name or from booking
            Tutor tutorEntity = findTutorForBooking(booking);
            
            if (tutorEntity == null || tutorEntity.getUser() == null) {
                throw new RuntimeException("Tutor not found or not linked to user");
            }

            ConversationDTO conversation = chatService.getOrCreateConversation(
                    student.getUser().getId(),
                    tutorEntity.getUser().getId()
            );

            // Create the greeting message request
            SendMessageRequest greetingRequest = new SendMessageRequest();
            greetingRequest.setConversationId(conversation.getId());
            greetingRequest.setContent(greetingMessage);
            greetingRequest.setMessageType("SYSTEM");

            // Send the message from tutor
            MessageDTO messageDTO = chatService.sendMessage(
                    conversation.getId(),
                    tutorEntity.getUser().getId(),
                    greetingRequest
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
    public MessageDTO sendDiagnosticTestMessage(Booking booking) {
        try {
            Student student = booking.getStudent();
            if (student == null || student.getUser() == null) {
                throw new RuntimeException("Student not found or not linked to user");
            }

            Tutor tutorEntity = findTutorForBooking(booking);
            if (tutorEntity == null || tutorEntity.getUser() == null) {
                throw new RuntimeException("Tutor not found or not linked to user");
            }

            ConversationDTO conversation = chatService.getOrCreateConversation(
                    student.getUser().getId(),
                    tutorEntity.getUser().getId()
            );

            String diagnosticMessage = "Please complete the Diagnostic Test to help us assess your current knowledge level in " 
                    + booking.getSubject() + ". This will help me tailor the lessons to your needs.";

            return sendSystemMessage(
                    conversation.getId(),
                    tutorEntity.getUser().getId(),
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
