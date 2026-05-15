package com.example.demo.config;

import com.example.demo.model.Student;
import com.example.demo.model.Tutor;
import com.example.demo.model.User;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One-time-on-startup backfill that copies phoneNumber from Student/Tutor
 * onto their linked User row when the User row's phoneNumber is still null.
 *
 * Historical signups only persisted the phone on the Student/Tutor side, which
 * left the profile preview empty for those users (the preview reads
 * /api/user/{id}). This runner heals existing rows; new signups already write
 * to both entities in AuthService.
 *
 * Uses @Transactional so the lazy Student.user / Tutor.user proxies stay
 * attached to a Hibernate session while we read them.
 */
@Component
public class PhoneBackfillRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PhoneBackfillRunner.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Override
    @Transactional
    public void run(String... args) {
        int updated = 0;

        List<Student> students = studentRepository.findAll();
        for (Student s : students) {
            if (s.getPhoneNumber() == null || s.getPhoneNumber().isBlank()) continue;
            User u = s.getUser();
            if (u == null) continue;
            Long uid = u.getId(); // safe — id read doesn't trigger proxy init
            User real = userRepository.findById(uid).orElse(null);
            if (real == null) continue;
            if (real.getPhoneNumber() == null || real.getPhoneNumber().isBlank()) {
                real.setPhoneNumber(s.getPhoneNumber());
                userRepository.save(real);
                updated++;
            }
        }

        List<Tutor> tutors = tutorRepository.findAll();
        for (Tutor t : tutors) {
            if (t.getPhoneNumber() == null || t.getPhoneNumber().isBlank()) continue;
            User u = t.getUser();
            if (u == null) continue;
            Long uid = u.getId();
            User real = userRepository.findById(uid).orElse(null);
            if (real == null) continue;
            if (real.getPhoneNumber() == null || real.getPhoneNumber().isBlank()) {
                real.setPhoneNumber(t.getPhoneNumber());
                userRepository.save(real);
                updated++;
            }
        }

        if (updated > 0) {
            log.info("PhoneBackfillRunner: copied phoneNumber onto {} User rows from Student/Tutor", updated);
        }
    }
}
