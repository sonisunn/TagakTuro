# Database Schema Relationship Diagram & Feature Checklist

## Visual: Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TAGAKTURO DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────┐
                                    │     users        │
                                    ├──────────────────┤
                                    │ id (PK)          │
                                    │ email (UNIQUE)   │
                                    │ password         │
                                    │ name             │
                                    │ studentId        │
                                    │ courseProgram    │
                                    │ phoneNumber      │
                                    └────────┬─────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
                        │                    │                    │
                    ┌─────────────┐   ┌──────────────┐       ┌─────────────┐
                    │  students   │   │ user_roles   │       │   tutors    │
                    ├─────────────┤   ├──────────────┤       ├─────────────┤
                    │ id (PK)     │   │ user_id (FK) │       │ id (PK)     │
                    │ user_id (FK)│   │ role         │       │ user_id (FK)│
             1→N    │ email       │   └──────────────┘       │ email       │
                    │ name        │        (N:N)             │ name        │
                    │ studentId   │                          │ tutorId     │
                    │ courseProgr │         ROLES:           │ phoneNumber │
                    └─────────────┘         ├─ ROLE_STUDENT └─────────────┘
                           │                ├─ ROLE_TUTOR
                           │                └─ ROLE_ADMIN
                           │
                    ┌──────┴──────────────────────────┐
                    │                                 │
                    │                            ┌────────────┐
             ┌──────┴──────┐                     │   tutors   │
             │  bookings   │1                    │   (cont.)  │
             ├─────────────┤                     ├────────────┤
             │ id (PK)     │                     │ bookings   │
             │ student(FK) │┼───●────1          │            │
             │ subject     │                     └────────────┘
             │ date/time   │
             │ status      │
             │ tutorName   │
             │ modality    │
             │ venue       │
             └─────────────┘


    MESSAGING SYSTEM:
    
    ┌──────────────────────────────────────────────────────────┐
    │              users (all conversation participants)       │
    └──────────────────────────────────────────────────────────┘
                          ▲                    ▲
                   1      │N              1     │N
                   ├──────┘                └────┤
                   │                            │
           ┌───────┴──────────┐                │
           │                  │                │
      ┌────────────┐    ┌─────────────┐       │
      │user1_id    │    │user2_id     │       │
      │   (FK)     │    │   (FK)      │       │
      │            │    │             │       │
    ┌─┴────────────┴────┴─────────────┴──────┐│
    │        conversations                   ││
    │  ┌─────────────────────────────────┐───┘│
    │  │ id (PK)                         │    │
    │  │ user1_id (FK) - unique pair     │    │
    │  │ user2_id (FK) - unique pair     │    │
    │  │ last_message_id (FK, nullable)  │    │
    │  │ createdAt                       │    │
    │  │ updatedAt                       │    │
    │  │ CONSTRAINT UNIQUE(user1, user2) │    │
    │  └─────────────┬───────────────────┤    │
    └───────────────┼───────────────────┘    │
                    │1              N        │
                    │              ┌─────────┘
                    │              │
                ┌───┴──────────────┴───┐
                │      messages        │
                ├──────────────────────┤
                │ id (PK)              │
                │ conversation_id (FK) │1
                │ sender_id (FK)       │◄───────┐ (points to any user)
                │ content (LONGTEXT)   │
                │ createdAt            │
                │ isRead               │
                │ readAt               │
                │ messageType          │
                │ INDEX: conversation  │
                │ INDEX: sender        │
                │ INDEX: createdAt     │
                └──────────────────────┘


    MODULE ASSIGNMENT & MATCHING SYSTEM:

    ┌────────────┐        ┌──────────────────┐        ┌──────────┐
    │   tutors   │◄───────│ pama_preferences │────────►│ modules  │
    ├────────────┤   N:N  ├──────────────────┤   N:N   ├──────────┤
    │ id (PK)    │        │ id (PK)          │        │ id (PK)  │
    │            │        │ tutor_id (FK)    │        │ module   │
    │            │        │ module_id (FK)   │        │ _name    │
    │     │      │        │ preferenceRank   │        │capacity  │
    │     │      │        │ score            │        │ is_activ │
    │     │      │        └──────────────────┘        │ e        │
    │     N      │                                    └──────────┘
    │     │      │              ▲
    │     │M     │              │
    │     │      │              │ 1
    │     └►─────┴─────────┬────┘
    │            │         │
    │        ┌───┴─────────┴──────┐
    │        │  pama_assignments  │
    │        ├────────────────────┤
    │        │ id (PK)            │
    │        │ tutor_id (FK)      │
    │        │ module_id (FK)     │
    │        │ status             │
    │        │ roundNumber        │
    │        │ matchingScore      │
    │        │ createdAt          │
    │        │ updatedAt          │
    │        └────────────────────┘


    TUTOR APPLICATION SYSTEM:

    ┌────────────────────────────┐
    │  tutor_applications        │
    ├────────────────────────────┤
    │ id (PK)                    │
    │ name                       │
    │ studentId (UNIQUE)         │
    │ email (UNIQUE)             │
    │ phoneNumber                │
    │ password                   │
    │ experience                 │
    │ timeAvailableStart         │
    │ timeAvailableEnd           │
    │ reportOfGradesPath         │
    │ certificatesPath           │
    │ status (PENDING/ACCEPTED)  │
    │ createdAt                  │
    └────────────────────────────┘
           ▲                    (On accept: Creates tutor & user accounts)
           │
           └──── becomes ─────► users + tutors (new records)
```

---

## Feature Checklist: Complete Application Audit

### ✅ Authentication & User Management

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Signup** | `/api/auth/signup` | POST | users, user_roles | All user fields + role | ✅ |
| **Login** | `/api/auth/login` | POST | users | email, password | ✅ |
| **JWT Tokens** | (AuthController) | - | users | email (for token generation) | ✅ |
| **Password Hashing** | (UserService) | - | users | password (BCrypt) | ✅ |
| **Role Assignment** | (AuthService) | - | user_roles | role (STUDENT/TUTOR/ADMIN) | ✅ |
| **User Profile** | `/api/student/{id}`, `/api/tutor/{id}` | GET | users, students/tutors | All profile fields | ✅ |

### ✅ Student Features

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Student Profile View** | `/api/student/{id}` | GET | students, users | All student fields | ✅ |
| **Student Profile Edit** | `/api/student/{id}` | PUT | students | name, courseProgram, phoneNumber | ✅ |
| **Student List View** | `/api/student` | GET | students, users | All student fields | ✅ |
| **View by Email** | `/api/student/email/{email}` | GET | students | email | ✅ |
| **View by StudentId** | `/api/student/studentId/{id}` | GET | students | studentId | ✅ |
| **Student Delete** | `/api/student/{id}` | DELETE | students | - | ✅ |

### ✅ Tutor Features

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Tutor Homepage** | `/api/tutor/homepage` | GET | tutors | - | ✅ |
| **Apply as Tutor** | `/api/tutor/apply` | POST | tutor_applications, files | name, email, experience, availability, files | ✅ |
| **View Applications** | `/api/tutor/applications` | GET | tutor_applications | All application fields | ✅ |
| **Accept Application** | `/api/tutor/applications/{id}/accept` | POST | tutor_applications, users, tutors | Creates new user + tutor record | ✅ |
| **Reject Application** | `/api/tutor/applications/{id}/reject` | POST | tutor_applications | status = REJECTED | ✅ |
| **Upload Documents** | `/api/tutor/apply` | POST (multipart) | files (disk), tutor_applications | reportOfGradesPath, certificatesPath | ✅ |

### ✅ Booking System

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Create Booking** | `/api/booking` | POST | bookings, students | student_id, subject, date, status, notes | ✅ |
| **View All Bookings** | `/api/booking` | GET | bookings | All booking fields | ✅ |
| **View Booking by ID** | `/api/booking/{id}` | GET | bookings | Single booking record | ✅ |
| **Filter by Student** | `/api/booking/student/{id}` | GET | bookings, students | student_id filter | ✅ |
| **Filter by Status** | `/api/booking/status/{status}` | GET | bookings | status (PENDING, CONFIRMED, etc.) | ✅ |
| **View Pending** | `/api/booking/pending` | GET | bookings | WHERE status = PENDING | ✅ |
| **Filter by Tutor** | `/api/booking/tutor/{name}` | GET | bookings | tutorName field | ✅ |
| **Update Status** | `/api/booking/{id}/status` | PATCH | bookings | status field | ✅ |
| **Cancel Booking** | `/api/booking/{id}/cancel` | POST | bookings | status = CANCELLED | ✅ |
| **Booking Details** | /api/booking/{id} | GET | bookings | subject, date, time, modality, venue, notes | ✅ |

### ✅ Messaging System

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Start Conversation** | `/api/chat/conversations/start` | POST | conversations, users | user1_id, user2_id | ✅ |
| **Get/Create Conversation** | `/api/chat/conversations/with/{userId}` | GET | conversations, users | Returns existing or creates new | ✅ |
| **List User Conversations** | `/api/chat/conversations` | GET | conversations, messages, users | Paginated conversation list | ✅ |
| **View Specific Conversation** | `/api/chat/conversations/{id}` | GET | conversations, messages | Full conversation history | ✅ |
| **Send Message** | `/api/chat/messages` | POST | messages, conversations | content, sender_id, conversation_id, timestamp | ✅ |
| **Get Messages** | `/api/chat/messages/conversation/{id}` | GET | messages | All messages in conversation | ✅ |
| **Mark as Read** | `/api/chat/messages/{id}/read` | PATCH | messages | isRead = true, readAt = timestamp | ✅ |
| **Real-time Chat** | `/app/chat/{conversationId}` | WebSocket | messages, conversations | STOMP protocol, live broadcasting | ✅ |
| **Tutor-Student Chat** | `/api/chat/tutor-student/start` | POST | conversations, tutors, students | Creates conversation between tutor + student | ✅ |
| **Message History** | `/api/chat/messages/conversation/{id}` | GET | messages | Searchable/ordered by timestamp | ✅ |
| **Unread Indicator** | (Messages) | - | messages | isRead = false | ✅ |

### ✅ Module Management

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **List Modules** | `/api/modules` | GET | modules | All active modules | ✅ |
| **View Module** | `/api/modules/{id}` | GET | modules | Single module details | ✅ |
| **Check Capacity** | `/api/modules/{id}/capacity` | GET | modules, pama_assignments | capacity vs current_tutors | ✅ |
| **Create Module** | `/api/modules` | POST | modules | module_name, description, capacity | ✅ |
| **Update Module** | `/api/modules/{id}` | PUT | modules | description, capacity | ✅ |
| **Deactivate Module** | `/api/modules/{id}` | DELETE | modules | is_active = false | ✅ |

### ✅ PAMA Algorithm (Tutor-Module Matching)

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Execute Matching** | `/api/pama/execute` | POST | pama_assignments, pama_preferences, tutors, modules | Runs stable marriage algorithm | ✅ |
| **View Confirmed Assignments** | `/api/pama/assignments/confirmed` | GET | pama_assignments | status = CONFIRMED | ✅ |
| **Get Module Assignments** | `/api/pama/assignments/module/{id}` | GET | pama_assignments, tutors | All tutors assigned to module | ✅ |
| **Get Tutor Assignments** | `/api/pama/assignments/tutor/{id}` | GET | pama_assignments, modules | All modules assigned to tutor | ✅ |
| **Submit Preferences** | `/api/pama/preferences/submit` | POST | pama_preferences | tutor_id, module_id, preferenceRank, score | ✅ |
| **Get Tutor Preferences** | `/api/pama/preferences/tutor/{id}` | GET | pama_preferences | All preferences for tutor | ✅ |
| **Matching Score** | (in assignments) | - | pama_assignments | matchingScore (algorithm output) | ✅ |
| **Round Tracking** | (in assignments) | - | pama_assignments | roundNumber (algorithm iteration) | ✅ |

### ✅ Automated Notifications

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Tutor Greeting** | `/api/messages/automated/tutor-greeting/{bookingId}` | POST | messages, conversations, bookings, users | Sends automated message to student | ✅ |
| **Message Automation** | (Service) | - | messages | content (templated), sender_id, conversation_id | ✅ |

### ✅ Admin Dashboard

| Feature | Endpoint(s) | Method | Tables Used | DB Fields | Status |
|---------|-----------|--------|-------------|-----------|--------|
| **Dashboard Stats** | `/api/admin/dashboard/stats` | GET | users, students, tutors, tutor_applications, bookings | COUNT(*) from each table | ✅ |
| **Total Users** | - | - | users | count() | ✅ |
| **Total Students** | - | - | students | count() | ✅ |
| **Total Tutors** | - | - | tutors | count() | ✅ |
| **Total Applications** | - | - | tutor_applications | count() | ✅ |
| **Total Bookings** | - | - | bookings | count() | ✅ |

---

## Database Schema Summary

### Table Count & Status
- **Total Tables:** 11
- **Total Records per Table:** depends on usage
- **Primary Entities:** 10 (User, Student, Tutor, Booking, Conversation, Message, Module, TutorApplication, PAMAAssignment, PAMAPreference)
- **Junction Tables:** 1 (user_roles)

### Data Types Used
- **Identifiers**: BIGINT (auto-increment)
- **Text**: VARCHAR(255), TEXT, LONGTEXT
- **Numbers**: INT, DOUBLE
- **Dates**: DATETIME, TIME
- **Booleans**: BOOLEAN
- **Enums**: VARCHAR with ENUM constraint (BookingStatus, MessageType, etc.)

### Key Constraints
- **Primary Keys**: 11 tables
- **Foreign Keys**: 12 relationships
- **Unique Constraints**: 6 (email fields, IDs)
- **Indexes**: 3 (conversation, sender, createdAt on messages table)

### Spring Data JPA Repositories
All 10 entity classes have corresponding Spring Data JPA Repository interfaces:
- ✅ UserRepository
- ✅ StudentRepository
- ✅ TutorRepository
- ✅ BookingRepository
- ✅ ConversationRepository
- ✅ MessageRepository
- ✅ ModuleRepository
- ✅ TutorApplicationRepository
- ✅ PAMAAssignmentRepository
- ✅ PAMAPreferenceRepository

---

## Verification Checklist

**Run this to verify database connectivity:**
```bash
# Backend is configured to auto-create all tables
cd backend
java -jar target/demo-0.0.1-SNAPSHOT.jar
# Watch for Hibernate DDL statements:
# "Hibernate: create table users..."
# "Hibernate: create table students..."
# etc.
```

**Verify specific endpoints:**
```bash
# Authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Student Profile
curl http://localhost:8080/api/student/1

# Bookings
curl http://localhost:8080/api/booking

# Modules
curl http://localhost:8080/api/modules

# Admin Stats
curl http://localhost:8080/api/admin/dashboard/stats
```

---

## Conclusion

✅ **All features are backed by proper database schema**  
✅ **Entity relationships are correctly defined**  
✅ **Database constraints match application requirements**  
✅ **API endpoints properly map to database operations**  

**The application is ready for production use with respect to database design.**
