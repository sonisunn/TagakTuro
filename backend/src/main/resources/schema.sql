-- Drop tables if they exist
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS tutors;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    student_id VARCHAR(255) NOT NULL,
    course_program VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255),
    password VARCHAR(255) NOT NULL
);

-- Create user_roles table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create students table
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    course_program VARCHAR(255),
    phone_number VARCHAR(255)
);

-- Create tutors table
CREATE TABLE tutors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tutor_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255)
);

-- Create bookings table
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    booking_date_time DATETIME NOT NULL,
    status VARCHAR(255) NOT NULL,
    tutor_name VARCHAR(255),
    notes TEXT,
    duration_minutes INT,
    modality VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(id)
);
