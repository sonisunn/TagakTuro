-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: tagakturo
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `booking_date_time` datetime(6) NOT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `modality` varchar(255) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','CONFIRMED','PENDING') NOT NULL,
  `subject` varchar(255) NOT NULL,
  `tutor_name` varchar(255) DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `student_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKeepf6u51hvrq5p0k3gcu29l7l` (`student_id`),
  CONSTRAINT `FKeepf6u51hvrq5p0k3gcu29l7l` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,'2026-04-18 22:24:00.000000',180,'Online','','CANCELLED','calcus','Dummy Tutor',NULL,2),(2,'2026-04-18 22:50:00.000000',61,'Online','','CANCELLED','calc','Dummy Tutor',NULL,2),(3,'2026-04-18 23:08:00.000000',120,'Online','','CANCELLED','calc','Dummy Tutor',NULL,2),(4,'2026-04-18 23:14:00.000000',120,'Online','','CANCELLED','calc','Dummy Tutor',NULL,2),(5,'2026-04-18 23:41:00.000000',180,'Online','','CANCELLED','calc','Dummy Tutor',NULL,2),(6,'2026-04-18 15:25:09.000000',180,'Online','','COMPLETED','calc','Dummy Tutor',NULL,2),(7,'2026-04-21 07:12:00.000000',3,'Online','','CONFIRMED','example','Dummy Tutor',NULL,2),(8,'2026-04-22 18:01:27.000000',3000,NULL,NULL,'COMPLETED','Testing Eligibility','Tutor Name',NULL,1),(9,'2026-04-22 18:03:59.000000',3000,NULL,NULL,'COMPLETED','Testing Eligibility','cj',NULL,1),(16,'2026-04-25 10:47:38.000000',60,'Online','Need help with derivatives','CONFIRMED','Calculus I','Maria Santos',NULL,4),(17,'2026-04-28 10:47:38.000000',90,'In-Person','Preparing for midterms','PENDING','Physics 101','Maria Santos',NULL,4),(18,'2026-04-20 10:47:38.000000',60,'Online','HTML/CSS/JS basics','COMPLETED','Web Development','Maria Santos',NULL,4),(19,'2026-05-22 18:48:00.000000',60,'Online',NULL,'PENDING','calc',NULL,NULL,4),(26,'2026-05-01 10:52:48.000000',60,'In-Person','Process scheduling algorithms','PENDING','Operating Systems','Daniel Cruz','Library',4),(34,'2026-05-01 10:53:43.000000',60,'In-Person','Process scheduling algorithms','PENDING','Operating Systems','Daniel Cruz','Library',4),(42,'2026-05-01 10:55:05.000000',60,'In-Person','Process scheduling algorithms','PENDING','Operating Systems','Daniel Cruz','Library',4),(44,'2026-04-24 10:58:36.000000',60,'Online','Need help with binary trees','CONFIRMED','Data Structures','Daniel Cruz',NULL,14),(45,'2026-04-29 10:58:36.000000',90,'In-Person','Sorting algorithms review','PENDING','Algorithms','Daniel Cruz','Library',14),(46,'2026-04-26 10:58:36.000000',60,'Online','Matrix operations','CONFIRMED','Linear Algebra','Elena Ramos',NULL,15),(47,'2026-04-18 10:58:36.000000',60,'In-Person','Great session on graph theory','COMPLETED','Discrete Math','Elena Ramos','OPVSSCD Conference Room',15),(48,'2026-04-25 10:58:36.000000',60,'Online','Probability distributions','PENDING','Statistics','Maria Santos',NULL,16),(49,'2026-04-16 10:58:36.000000',90,'Online','Integration techniques','COMPLETED','Calculus II','Maria Santos',NULL,16),(50,'2026-05-01 10:58:36.000000',60,'In-Person','Process scheduling algorithms','PENDING','Operating Systems','Daniel Cruz','Library',4),(51,'2026-04-21 10:58:36.000000',60,'Online','Had a schedule conflict','CANCELLED','Database Systems','Maria Santos',NULL,14);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_message_id` bigint(20) DEFAULT NULL,
  `user1_id` bigint(20) NOT NULL,
  `user2_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK1wksqcxengyd9lt6yi3ul0elp` (`user1_id`,`user2_id`),
  UNIQUE KEY `UKbap2ig9x1dq1y1revhfjkk64l` (`last_message_id`),
  KEY `idx_conversations_user1_id` (`user1_id`),
  KEY `idx_conversations_user2_id` (`user2_id`),
  CONSTRAINT `FK8wv0rmd8jb3cqcbyng15ubrmk` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKd9sy3cjuppb511olt5pv3ixe` FOREIGN KEY (`last_message_id`) REFERENCES `messages` (`id`),
  CONSTRAINT `FKe7w0k1xem21pp85wxh5moodnk` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_conversations_last_message` FOREIGN KEY (`last_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (11,'2026-04-20 10:58:36.000000','2026-04-23 10:58:36.000000',33,20,21),(12,'2026-04-21 10:58:36.000000','2026-04-23 10:58:36.000000',36,38,41),(13,'2026-04-18 10:58:36.000000','2026-04-23 10:58:36.000000',40,39,42);
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedbacks`
--

DROP TABLE IF EXISTS `feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedbacks` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) NOT NULL,
  `reviewer_id` bigint(20) NOT NULL,
  `reviewee_id` bigint(20) NOT NULL,
  `rating` int(11) NOT NULL,
  `comments` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_feedbacks_booking_reviewer` (`booking_id`,`reviewer_id`),
  KEY `reviewer_id` (`reviewer_id`),
  KEY `reviewee_id` (`reviewee_id`),
  CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feedbacks_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feedbacks_ibfk_3` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbacks`
--

LOCK TABLES `feedbacks` WRITE;
/*!40000 ALTER TABLE `feedbacks` DISABLE KEYS */;
INSERT INTO `feedbacks` VALUES (1,6,6,5,3,'sdsd','2026-04-18 00:27:07'),(2,6,2,6,2,'clb','2026-04-18 00:54:15'),(3,1,1,4,5,'Testing certificate eligibility!','2026-04-22 10:04:45'),(7,18,20,21,5,'Excellent tutor! Very patient and explains concepts clearly.','2026-04-21 02:47:38'),(8,18,21,20,4,'Great student, very eager to learn. Comes prepared with questions.','2026-04-22 02:47:38'),(21,47,39,42,5,'Elena is amazing! She made graph theory so easy to understand.','2026-04-19 02:58:36'),(22,47,42,39,5,'Carlos is a dedicated student. Always comes prepared.','2026-04-20 02:58:36'),(23,49,40,21,4,'Good session, but could use more practice problems.','2026-04-17 02:58:36'),(24,49,21,40,5,'Bea is very attentive and asks great questions!','2026-04-18 02:58:36');
/*!40000 ALTER TABLE `feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int(11) NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int(11) DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT current_timestamp(),
  `execution_time` int(11) NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flyway_schema_history`
--

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
INSERT INTO `flyway_schema_history` VALUES (1,'0','<< Flyway Baseline >>','BASELINE','<< Flyway Baseline >>',NULL,'tagak_user','2026-04-18 05:32:31',0,1),(2,'1','baseline schema','SQL','V1__baseline_schema.sql',549815031,'tagak_user','2026-04-18 05:32:31',121,1),(3,'2','seed data','SQL','V2__seed_data.sql',309875200,'tagak_user','2026-04-18 05:32:31',12,1),(4,'3','add notifications table','SQL','V3__add_notifications_table.sql',-1632284266,'tagak_user','2026-04-18 06:19:29',28,1),(5,'4','add feedbacks table','SQL','V4__add_feedbacks_table.sql',1262896355,'tagak_user','2026-04-18 08:20:54',22,1),(6,'5','add course program to tutors','SQL','V5__add_course_program_to_tutors.sql',-1605038776,'tagak_user','2026-04-21 05:51:31',19,1),(7,'6','add extra fields to tutors','SQL','V6__add_extra_fields_to_tutors.sql',237715056,'tagak_user','2026-04-21 06:34:03',17,1),(8,'7','add cert issued to tutors','SQL','V7__add_cert_issued_to_tutors.sql',675756070,'tagak_user','2026-04-22 09:49:27',18,1),(9,'8','add new accounts and populate data','SQL','V8__add_new_accounts_and_populate_data.sql',880993832,'tagak_user','2026-04-23 02:47:38',67,1),(10,'9','populate all tables','SQL','V9__populate_all_tables.sql',-1478702041,'tagak_user','2026-04-23 02:58:37',92,1);
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_read` bit(1) NOT NULL,
  `message_type` enum('FILE','IMAGE','SYSTEM','TEXT') DEFAULT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `conversation_id` bigint(20) NOT NULL,
  `sender_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `FK4ui4nnwntodh6wjvck53dbk9m` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKt492th6wsovh1nush5yl5jj8e` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (29,'Hi Maria! Can you help me with Calculus derivatives?','2026-04-20 10:58:36.000000','','TEXT',NULL,11,20),(30,'Of course Juan! I\'d be happy to help. When are you available?','2026-04-20 10:58:36.000000','','TEXT',NULL,11,21),(31,'I\'m free tomorrow afternoon. Would 2pm work?','2026-04-21 10:58:36.000000','','TEXT',NULL,11,20),(32,'Perfect! I\'ll see you then. Make sure to bring your notes from class.','2026-04-21 10:58:36.000000','','TEXT',NULL,11,21),(33,'Thanks so much! See you tomorrow :)','2026-04-22 10:58:36.000000','\0','TEXT',NULL,11,20),(34,'Hello Daniel! I booked a Data Structures session with you.','2026-04-21 10:58:36.000000','','TEXT',NULL,12,38),(35,'Hey Ana! Yes, I saw the booking. Looking forward to it!','2026-04-21 10:58:36.000000','','TEXT',NULL,12,41),(36,'Can we focus on AVL trees? That\'s where I\'m struggling.','2026-04-22 10:58:36.000000','\0','TEXT',NULL,12,38),(37,'Hi Elena! Thank you for the session yesterday. It was really helpful.','2026-04-19 10:58:36.000000','','TEXT',NULL,13,39),(38,'Glad to hear that Carlos! You did great on those graph problems.','2026-04-19 10:58:36.000000','','TEXT',NULL,13,42),(39,'I already booked another session for Linear Algebra. Hope that works!','2026-04-22 10:58:36.000000','','TEXT',NULL,13,39),(40,'I confirmed it. See you soon!','2026-04-23 10:58:36.000000','\0','TEXT',NULL,13,42);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modules` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `capacity` int(11) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `current_tutors` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `module_name` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKe3rp5imk1rv3gl2q6irlkd1ip` (`module_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES (6,3,'2026-04-23 10:58:36.000000',1,'Limits, derivatives, and introduction to integration','','Calculus I','2026-04-23 10:58:36.000000'),(7,3,'2026-04-23 10:58:36.000000',1,'Arrays, linked lists, trees, graphs, and hash tables','','Data Structures','2026-04-23 10:58:36.000000'),(8,2,'2026-04-23 10:58:36.000000',1,'Vectors, matrices, eigenvalues, and linear transformations','','Linear Algebra','2026-04-23 10:58:36.000000'),(9,2,'2026-04-23 10:58:36.000000',0,'Mechanics, thermodynamics, and waves','','Physics 101','2026-04-23 10:58:36.000000'),(10,3,'2026-04-23 10:58:36.000000',1,'HTML, CSS, JavaScript, and React fundamentals','','Web Development','2026-04-23 10:58:36.000000');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` varchar(255) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `date_sent` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (2,5,'Booking Confirmed!','Your booking for calc has been confirmed. Check your messages!',1,'2026-04-17 23:41:43'),(4,5,'Booking Confirmed!','Your booking for calc has been confirmed. Check your messages!',1,'2026-04-17 23:52:59'),(6,5,'Booking Confirmed!','Your booking for example has been confirmed. Check your messages!',1,'2026-04-18 07:13:02'),(7,7,'Application Approved!','Your tutor application has been approved. Welcome to TagakTuro!',0,'2026-04-20 22:15:43'),(8,8,'Application Approved!','Your tutor application has been approved. Welcome to TagakTuro!',0,'2026-04-20 22:44:48'),(9,7,'Application Approved!','Your tutor application has been approved. Welcome to TagakTuro!',0,'2026-04-20 23:02:16'),(10,7,'Application Approved!','Your tutor application has been approved. Welcome to TagakTuro!',0,'2026-04-20 23:04:09'),(11,7,'Application Approved!','Your tutor application has been approved. Welcome to TagakTuro!',0,'2026-04-20 23:06:25'),(12,7,'Application Approved!','Your tutor application has been approved. Welcome to TagakTuro!',0,'2026-04-20 23:07:13'),(13,7,'Application Approved!','Your tutor application has been approved. Welcome to TagakTuro!',0,'2026-04-20 23:12:43'),(20,20,'Booking Confirmed!','Your Calculus I session with Maria Santos has been confirmed.',0,'2026-04-23 02:47:38'),(21,20,'Session Completed','Your Web Development session has been marked as completed. Leave a review!',1,'2026-04-21 02:47:38'),(22,21,'New Booking Request','Juan Dela Cruz has requested a Physics 101 session.',0,'2026-04-23 02:47:38'),(23,21,'Feedback Received','You received a 5-star review from Juan Dela Cruz!',0,'2026-04-22 02:47:38'),(55,38,'Booking Confirmed!','Your Data Structures session with Daniel Cruz has been confirmed.',0,'2026-04-23 02:58:36'),(56,38,'Welcome to TagakTuro!','Start booking tutors to boost your grades!',1,'2026-04-13 02:58:36'),(57,39,'Session Completed','Your Discrete Math session is complete. Leave a review!',0,'2026-04-19 02:58:36'),(58,39,'Booking Confirmed!','Your Linear Algebra session with Elena Ramos has been confirmed.',0,'2026-04-23 02:58:36'),(59,40,'Session Completed','Your Calculus II session is complete. Leave a review!',0,'2026-04-17 02:58:36'),(60,41,'New Booking Request','Ana Reyes has requested an Algorithms session.',0,'2026-04-23 02:58:36'),(61,41,'New Booking Request','Juan Dela Cruz has requested an Operating Systems session.',0,'2026-04-23 02:58:36'),(62,41,'Feedback Received','You received a 5-star review!',1,'2026-04-20 02:58:36'),(63,42,'Feedback Received','Carlos Garcia left you a review.',0,'2026-04-19 02:58:36'),(64,42,'New Booking Request','Carlos Garcia has requested a Linear Algebra session.',1,'2026-04-22 02:58:36');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pama_assignments`
--

DROP TABLE IF EXISTS `pama_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pama_assignments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `matching_score` double DEFAULT NULL,
  `round_number` int(11) DEFAULT NULL,
  `status` enum('CONFIRMED','DEADLOCK','PENDING','REJECTED') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `module_id` bigint(20) NOT NULL,
  `tutor_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pama_assignments_tutor_id` (`tutor_id`),
  KEY `idx_pama_assignments_module_id` (`module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pama_assignments`
--

LOCK TABLES `pama_assignments` WRITE;
/*!40000 ALTER TABLE `pama_assignments` DISABLE KEYS */;
INSERT INTO `pama_assignments` VALUES (5,'2026-04-23 10:58:36.000000',0.95,1,'CONFIRMED','2026-04-23 10:58:36.000000',6,5),(6,'2026-04-23 10:58:37.000000',0.92,1,'CONFIRMED','2026-04-23 10:58:37.000000',7,12),(7,'2026-04-23 10:58:37.000000',0.97,1,'CONFIRMED','2026-04-23 10:58:37.000000',8,13),(8,'2026-04-23 10:58:37.000000',0.88,1,'PENDING','2026-04-23 10:58:37.000000',10,12);
/*!40000 ALTER TABLE `pama_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pama_preferences`
--

DROP TABLE IF EXISTS `pama_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pama_preferences` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `preference_rank` int(11) DEFAULT NULL,
  `score` double DEFAULT NULL,
  `module_id` bigint(20) NOT NULL,
  `tutor_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pama_preferences_tutor_id` (`tutor_id`),
  KEY `idx_pama_preferences_module_id` (`module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pama_preferences`
--

LOCK TABLES `pama_preferences` WRITE;
/*!40000 ALTER TABLE `pama_preferences` DISABLE KEYS */;
INSERT INTO `pama_preferences` VALUES (7,1,0.95,6,5),(8,2,0.85,10,5),(9,1,0.92,7,12),(10,2,0.88,10,12),(11,1,0.97,8,13),(12,2,0.9,6,13);
/*!40000 ALTER TABLE `pama_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `course_program` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `student_id` varchar(255) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKe2rndfrsx22acpq2ty1caeuyw` (`email`),
  UNIQUE KEY `UK5mbus2m1tm2acucrp6t627jmx` (`student_id`),
  UNIQUE KEY `UKg4fwvutq09fjdlb4bb0byp7t` (`user_id`),
  CONSTRAINT `FKdt1cjx5ve5bdabmuuf3ibrwaq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'Computer Science','student@example.com','Test Student','1234567890','S123456',NULL),(2,'ccis - comscie','carmojallas.a12345677@umak.edu.ph','caleb','09602825151','a12131',NULL),(3,'comscie','samolivare123@umak.edu.ph','jshjoshua','09602825151','a12345667',9),(4,'BS Computer Science','teststudent@umak.edu.ph','Juan Dela Cruz','09171234567','K12345678',20),(14,'BS Information Technology','areyes@umak.edu.ph','Ana Reyes','09170001111','K11111111',38),(15,'BS Computer Engineering','cgarcia@umak.edu.ph','Carlos Garcia','09170002222','K22222222',39),(16,'BS Mathematics','blim@umak.edu.ph','Bea Lim','09170003333','K33333333',40);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutor_applications`
--

DROP TABLE IF EXISTS `tutor_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tutor_applications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `certificates_path` varchar(255) DEFAULT NULL,
  `course_program` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `experience` tinytext NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `report_of_grades_path` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `time_available_end` time(6) NOT NULL,
  `time_available_start` time(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK31xpk85kldh4wok54fwks0qlu` (`email`),
  UNIQUE KEY `UKoy4balkcrjrguqc7aeyvea0q8` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutor_applications`
--

LOCK TABLES `tutor_applications` WRITE;
/*!40000 ALTER TABLE `tutor_applications` DISABLE KEYS */;
INSERT INTO `tutor_applications` VALUES (1,'2b9ce366-7a80-4483-9b45-f4f6435acc5a_A123456770126cor.pdf','cbsb','2026-04-21 06:13:49.000000','calebjoshuaarmojallas@gmail.com','hshs','caleb','$2a$10$wEmigfRxwDUr8.21spdHXeDd3sr/7mugDwAFq72CiT9cLjGQtLFoe','09602825151','f72210fd-52ca-49d2-a1fe-1d2542c91a8d_A123456770126cor.pdf','APPROVED','a19392','23:59:59.000000','00:00:00.000000'),(2,'604d56f9-1c39-4088-aa0c-8e8c03d987f7_A123456770126cor.pdf','bs comscpei','2026-04-21 06:38:33.000000','carmojallas.a12345677@umak.edu.ph','yow','caleb','$2a$10$VZLms..8MNL1Bv46RYj.n.QPxbqmZm5xowxNn3vYAB.3Qtzjtc7GS','09662825151','2c8e543a-20c7-44dc-82ae-31a5bb8ba35f_A123456770126cor.pdf','APPROVED','a123456777','23:59:59.000000','00:00:00.000000'),(6,NULL,'BS Computer Science','2026-04-22 10:58:36.000000','rmendoza@umak.edu.ph','Tutored classmates in programming for 2 years. Strong in Java, Python, and C++.','Rico Mendoza','$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6','09170006666','uploads/grades/rmendoza_rog.pdf','PENDING','K66666666','17:00:00.000000','09:00:00.000000'),(7,NULL,'BS Accountancy','2026-04-21 10:58:36.000000','stan@umak.edu.ph','Dean\'s lister for 3 semesters. Experience tutoring in Financial Accounting and Taxation.','Sofia Tan','$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6','09170007777','uploads/grades/stan_rog.pdf','PENDING','K77777777','20:00:00.000000','13:00:00.000000'),(8,NULL,'BS Electrical Engineering','2026-04-23 10:58:36.000000','mvillanueva@umak.edu.ph','Lab assistant for Physics dept. 1 year experience tutoring Circuit Analysis.','Mark Villanueva','$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6','09170008888','uploads/grades/mvillanueva_rog.pdf','PENDING','K88888888','16:00:00.000000','08:00:00.000000');
/*!40000 ALTER TABLE `tutor_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutors`
--

DROP TABLE IF EXISTS `tutors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tutors` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `tutor_id` varchar(255) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `course_program` varchar(255) DEFAULT NULL,
  `sessions_done` int(11) DEFAULT 0,
  `total_hours` double DEFAULT 0,
  `rating` double DEFAULT 0,
  `is_cert_issued` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcx2524pmv5o93f0aihe1o8lgp` (`email`),
  UNIQUE KEY `UK735fgp5skm5jvlx53bnwn6qhy` (`tutor_id`),
  UNIQUE KEY `UKoomuva6iousalbrgq3rokdvcl` (`user_id`),
  CONSTRAINT `FKn424cac0223d6gthmgnn350mc` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutors`
--

LOCK TABLES `tutors` WRITE;
/*!40000 ALTER TABLE `tutors` DISABLE KEYS */;
INSERT INTO `tutors` VALUES (1,'tutor@example.com','Test Tutor','1234567890','TUTOR001',NULL,NULL,0,0,0,0),(2,'dummy.tutor@umak.edu.ph','Dummy Tutor','09123456789','TUTOR-999',6,NULL,1,3,2,0),(3,'caleb@umak.edu.ph','caleb','09602825151','ffe5d7be-7a03-4938-8f2f-0e311474787b',NULL,'cbsb',0,0,0,0),(4,'carmojallas.a12345677@umak.edu.ph','cj','09662825151','a123456777',8,'bs comscpei',1,50,5,1),(5,'testtutor@umak.edu.ph','Maria Santos','09179876543','K87654321',21,'BS Information Technology',10,15,4.8,0),(12,'dcruz@umak.edu.ph','Daniel Cruz','09170004444','K44444444',41,'BS Computer Science',15,22.5,4.7,0),(13,'eramos@umak.edu.ph','Elena Ramos','09170005555','K55555555',42,'BS Mathematics',8,12,4.9,0);
/*!40000 ALTER TABLE `tutors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `user_id` bigint(20) NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  KEY `FKhfh9dx7w3ubf1co1vdev94g3f` (`user_id`),
  CONSTRAINT `FKhfh9dx7w3ubf1co1vdev94g3f` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,'STUDENT'),(2,'TUTOR'),(3,'ROLE_ADMIN'),(4,'ROLE_CCED'),(5,'ROLE_STUDENT'),(6,'ROLE_TUTOR'),(7,'ROLE_TUTOR'),(8,'ROLE_TUTOR'),(9,'ROLE_STUDENT'),(18,'ROLE_ADMIN'),(19,'ROLE_CCED'),(20,'ROLE_STUDENT'),(21,'ROLE_TUTOR'),(38,'ROLE_STUDENT'),(39,'ROLE_STUDENT'),(40,'ROLE_STUDENT'),(41,'ROLE_TUTOR'),(42,'ROLE_TUTOR');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `course_program` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `student_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Computer Science','student@example.com','Test Student','$2a$10$7zJxSIhDrt3RIt21W7CnDetNX.kPobPizSxxNLAdXNM65khScRd92','1234567890','S123456'),(2,'N/A','tutor@example.com','Test Tutor','$2a$10$NnIepEKAZpYr.XCeViRE6uGn3lRX6cJ7dxndPVhNd0pGQitDjEFUe','1234567890','TUTOR001'),(3,'N/A','admin@umak.edu.ph','Admin','$2a$10$peenYhWNan79paPgeD.WVeHGR43t0pu1co6SWQXtunCBiYD/yt9.m','0000000000','ADMIN001'),(4,'N/A','cced@umak.edu.ph','CCED Admin','$2a$10$x3mNIehtHATtynOmOe2OLuyXkURAyCdA.kPsYOaxTokjwGLaUgQju','0000000001','CCED001'),(5,'ccis - comscie','carmojallas.a12345677@test.com','caleb','$2a$10$K27BwsuaXomFg4udgEwTtuRJ.uPUHQbSCZbQSN7Ziq6akzfYTsxMK',NULL,'a12131'),(6,'CCIS - Computer Science','dummy.tutor@umak.edu.ph','Dummy Tutor','$2a$10$KTXL6Y6xU694Oor0fYads.284TTq14jGLKNNGbMBA9mUki2ZD6l3u','09123456789','TUTOR-999'),(7,'cbsb','calebjoshuaarmojallas@gmail.com','caleb','$2a$10$mU55AMQ5qBOpwhyeUBMeceLTTdoDNfwtk2jq12Jstui6s685VvJva','09602825151','a19392'),(8,'bs comscpei','carmojallas.a12345677@umak.edu.ph','caleb','$2a$10$Argu4zpSzO3Ijv4RZekKzOhoLehnMd62tD5Uicsi8HS0nOnGfLJvm','09662825151','a123456777'),(9,'comscie','samolivare123@gmail.com','jshjoshua','$2a$10$aVevudkeK4RMWhFszX0.wexzBE2fmCYZuHL3EP5t9g1xjFPYH4Djy',NULL,'a12345667'),(18,'N/A','TagakOVPSSCD@gmail.com','Admin','$2a$10$kPbd5fEi9P4sMkqoiWaBAucQ4qKUZwcPjh9Xj3RfClOqDTQU7224S','0000000010','OVPSSCD002'),(19,'N/A','TagakCCED@gmail.com','CCED Admin','$2a$10$/JBJfxLivdWr3mylFJwTX.Sb0/.de7IGWvRQnP80cCXEUGVGcqlni','0000000011','CCED002'),(20,'BS Computer Science','teststudent@umak.edu.ph','Juan Dela Cruz','$2a$10$qgWWfI96bfytEb8aVFt/Ee/hCDmmhP01pNX3uoV8jRDnEsCve1q1C','09171234567','K12345678'),(21,'BS Information Technology','testtutor@umak.edu.ph','Maria Santos','$2a$10$hICiUYJi6naWf8zEN0764OVdHf3BmLuo5F8YjTiJgUQSk1b.YpbkO','09179876543','K87654321'),(38,'BS Information Technology','areyes@umak.edu.ph','Ana Reyes','$2a$10$I5BQou72GRFZvsxO3mFBV.mHWMa.v5CniTIYtuULGh/1setbKosOe','09170001111','K11111111'),(39,'BS Computer Engineering','cgarcia@umak.edu.ph','Carlos Garcia','$2a$10$8mYBUJWNChGleAC/GNAmrO23TF66PAT3TCBaQsZryemvi7Y5eqGei','09170002222','K22222222'),(40,'BS Mathematics','blim@umak.edu.ph','Bea Lim','$2a$10$8i6bKD/84GjXet8mcq/uku9XbfxXocPDMnEMR7SBukc0UhVeCIka6','09170003333','K33333333'),(41,'BS Computer Science','dcruz@umak.edu.ph','Daniel Cruz','$2a$10$WF9fXIGQj3fMNFxTrShuqeBH6ws52FcDi9EK5aqaLUO7VVDoXX/gC','09170004444','K44444444'),(42,'BS Mathematics','eramos@umak.edu.ph','Elena Ramos','$2a$10$h95eJc3.Oai.dqxNfcBxzuRpvPdVM3BGNZK3CiJ.NjiIIlBmudInq','09170005555','K55555555');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-23 11:50:25
