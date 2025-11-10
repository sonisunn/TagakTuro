package com.example.demo.service;

import com.example.demo.model.Student;
import com.example.demo.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    // Get all students
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    // Get student by ID
    public Student getStudentById(Long id) {
        if (id == null) {
            throw new RuntimeException("Student ID cannot be null");
        }
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }

    // Get student by email
    public Student getStudentByEmail(String email) {
        return studentRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found with email: " + email));
    }

    // Get student by studentId
    public Student getStudentByStudentId(String studentId) {
        return studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with studentId: " + studentId));
    }

    // Create a new student
    public Student createStudent(Student student) {
        // Check if email already exists
        if (studentRepository.existsByEmail(student.getEmail())) {
            throw new RuntimeException("Email already in use: " + student.getEmail());
        }

        // Check if studentId already exists
        if (studentRepository.existsByStudentId(student.getStudentId())) {
            throw new RuntimeException("Student ID already in use: " + student.getStudentId());
        }

        return studentRepository.save(student);
    }

    // Update an existing student
    public Student updateStudent(Long id, Student studentDetails) {
        Student student = getStudentById(id);

        // Check if email is being changed and if new email already exists
        if (!student.getEmail().equals(studentDetails.getEmail()) && 
            studentRepository.existsByEmail(studentDetails.getEmail())) {
            throw new RuntimeException("Email already in use: " + studentDetails.getEmail());
        }

        // Check if studentId is being changed and if new studentId already exists
        if (!student.getStudentId().equals(studentDetails.getStudentId()) && 
            studentRepository.existsByStudentId(studentDetails.getStudentId())) {
            throw new RuntimeException("Student ID already in use: " + studentDetails.getStudentId());
        }

        // Update fields
        student.setName(studentDetails.getName());
        student.setStudentId(studentDetails.getStudentId());
        student.setEmail(studentDetails.getEmail());
        student.setCourseProgram(studentDetails.getCourseProgram());
        student.setPhoneNumber(studentDetails.getPhoneNumber());

        return studentRepository.save(student);
    }

    // Delete a student
    public void deleteStudent(Long id) {
        if (id == null) {
            throw new RuntimeException("Student ID cannot be null");
        }
        Student student = getStudentById(id);
        studentRepository.delete(student);
    }
}

