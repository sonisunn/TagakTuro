package com.example.demo.repository;

import com.example.demo.model.PAMAModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PAMAModuleRepository extends JpaRepository<PAMAModule, Long> {
    
    List<PAMAModule> findByStatus(String status);
    
    List<PAMAModule> findBySubject(String subject);
    
    List<PAMAModule> findAllByOrderByPriorityDesc();
    
    List<PAMAModule> findByStatusAndCurrentTutorsAssignedLessThan(String status, Integer maxTutors);
}