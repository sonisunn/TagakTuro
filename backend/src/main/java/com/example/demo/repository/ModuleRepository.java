package com.example.demo.repository;

import com.example.demo.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {
    Optional<Module> findByModuleName(String moduleName);
    List<Module> findByIsActive(Boolean isActive);
}