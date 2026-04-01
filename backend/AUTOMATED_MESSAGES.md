# Automated Message System - Implementation Guide

## Overview
The Automated Message System sends contextual system messages to students from their matched tutors. This includes greeting messages, diagnostic test instructions, and custom system notifications within the chat.

---

## 📨 Features Implemented

### 1. **Automated Tutor Greeting**
When a student is matched with a tutor, an automated greeting message is sent:

```
"Hello! I am [Tutor Name], your matched tutor for [Subject], and your preferred modality is [Modality].

Kindly answer the Diagnostic Test so we can assess your current knowledge.

📋 Diagnostic Test

I'm looking forward to a swift study session with you!"
```

**Dynamic elements:**
- `[Tutor Name]` - From booking.tutorName
- `[Subject]` - From booking.subject
- `[Modality]` - From booking.modality (e.g., Online, In-person)

### 2. **Diagnostic Test Instruction**
Sends a follow-up message prompting students to complete the diagnostic test.

### 3. **Study Session Readiness**
Tutor can send a message confirming readiness for the study session.

### 4. **Custom System Messages**
Send any custom system message between tutor and student.

---

## 🔌 API Endpoints

### 1. Send Tutor Greeting (When Booking is Confirmed)
```http
POST /api/messages/automated/tutor-greeting/{bookingId}
```

**Response:**
```json
{
  "status": "success",
  "message": "Tutor greeting sent successfully",
  "messageData": {
    "id": 1,
    "conversationId": 1,
    "senderId": 2,
    "senderName": "Juan",
    "content": "Hello! I am Juan, your matched tutor for Computer Science...",
    "createdAt": "2026-03-06T19:30:45",
    "isRead": false,
    "messageType": "SYSTEM"
  },
  "bookingId": 1
}
```

**Example:**
```bash
curl -X POST "http://localhost:8080/api/messages/automated/tutor-greeting/1"
```

### 2. Send Diagnostic Test Instruction
```http
POST /api/messages/automated/diagnostic-test/{bookingId}
```

**Response:**
```json
{
  "status": "success",
  "message": "Diagnostic test instruction sent",
  "messageData": { ... }
}
```

### 3. Send Study Readiness Message
```http
POST /api/messages/automated/study-readiness?conversationId=1&tutorUserId=2&subject=Computer%20Science
```

**Response:**
```json
{
  "status": "success",
  "message": "Study readiness message sent",
  "messageData": { ... }
}
```

### 4. Send Custom System Message
```http
POST /api/messages/automated/custom?conversationId=1&senderUserId=2
Content-Type: application/json

{
  "content": "Your custom message here"
}
```

---

## 🔄 Integration with Booking System

### Recommended Workflow

When a booking is created and confirmed:

```
1. Booking Created/Confirmed
         ↓
2. POST /api/messages/automated/tutor-greeting/{bookingId}
         ↓
3. Automated greeting sent to student
         ↓
4. Student sees message in chat
         ↓
5. Student completes diagnostic test
         ↓
6. Schedule study session
```

### Code Example (Backend Integration)

If integrating with BookingController:

```java
// In BookingController or BookingService
@PostMapping("/{id}/confirm")
public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
    Booking booking = bookingRepository.findById(id).orElseThrow();
    booking.setStatus(BookingStatus.CONFIRMED);
    bookingRepository.save(booking);
    
    // Send automated greeting message
    try {
        automatedMessageService.sendTutorGreetingMessage(booking);
    } catch (Exception e) {
        // Log error but don't fail the booking confirmation
        logger.warn("Failed to send greeting message: " + e.getMessage());
    }
    
    return ResponseEntity.ok(booking);
}
```

---

## 📊 Message Types

The system supports different message types:

| Type | Purpose | Usage |
|------|---------|-------|
| **TEXT** | Regular chat messages | Student-tutor conversation |
| **SYSTEM** | Automated/system messages | Greetings, instructions, alerts |
| **IMAGE** | Image messages | Share resources, diagrams |
| **FILE** | File attachments | Share documents, worksheets |

---

## 🗂️ File Structure

Created files:
```
backend/src/main/java/com/example/demo/
├── service/
│   └── AutomatedMessageService.java    (Business logic)
└── controller/
    └── AutomatedMessageController.java (HTTP endpoints)
```

---

## 🔑 Key Classes

### AutomatedMessageService
**Methods:**
- `sendTutorGreetingMessage(Booking)` - Send greeting from tutor
- `sendDiagnosticTestMessage(Booking)` - Send diagnostic test instruction
- `sendStudyReadinessMessage(conversationId, tutorUserId, subject)` - Send readiness message
- `sendSystemMessage(conversationId, senderUserId, content)` - Custom system message
- `buildTutorGreetingMessage(tutorName, subject, modality)` - Format greeting text

### AutomatedMessageController
**Endpoints:**
- `POST /api/messages/automated/tutor-greeting/{bookingId}`
- `POST /api/messages/automated/diagnostic-test/{bookingId}`
- `POST /api/messages/automated/study-readiness`
- `POST /api/messages/automated/custom`
- `GET /api/messages/automated/health`

---

## 🧪 Testing the System

### Step 1: Start Backend
```bash
cd backend
mvn spring-boot:run
```

### Step 2: Test Health Check
```bash
curl http://localhost:8080/api/messages/automated/health
```

Response:
```json
{
  "status": "Automated message service is running",
  "timestamp": 1234567890
}
```

### Step 3: Test Greeting Message
Assuming Booking ID 1 exists:
```bash
curl -X POST "http://localhost:8080/api/messages/automated/tutor-greeting/1"
```

### Step 4: View in Chat
The message will appear in the conversation between the student and tutor.

---

## ⚙️ Configuration Notes

### Current Implementation
- Uses existing Chat System infrastructure (Conversation, Message, ChatService)
- Leverages User-Student-Tutor relationships
- Sends messages as SYSTEM type
- Messages are persisted in database

### Future Enhancements
- Email notification when automated message sent
- Push notifications to mobile app
- Scheduled messages (send at specific time)
- Multi-language message templates
- Rich message formatting (markdown, HTML)

---

## 🐛 Troubleshooting

### Issue: "Booking not found"
**Solution:** Ensure the booking ID is correct and the booking exists in the database.

### Issue: "Student/Tutor not linked to user"
**Solution:** When creating bookings, ensure Student and Tutor records have valid User records linked via `user_id` foreign key.

### Issue: "Tutor not found in booking"
**Solution:** The system tries to find tutor by matching tutor name. Ensure `booking.tutorName` matches a Tutor's name in the database.

---

## 📋 Latest Database Schema

Tables involved:
- `users` - User authentication
- `students` - Student profiles (linked to users)
- `tutors` - Tutor profiles (linked to users)
- `bookings` - Booking records
- `conversations` - Chat conversations
- `messages` - Chat messages (where automated messages are stored)

---

## ✅ Status

✅ Automated messaging service implemented
✅ Tutor greeting message generation
✅ Diagnostic test instruction support
✅ REST API endpoints created
✅ Database integration complete
✅ 60 source files compiled successfully

Ready for integration with booking confirmation flow!
