package com.projectmanagement.task_manager_backend.repository;

import com.projectmanagement.task_manager_backend.entity.Project;
import com.projectmanagement.task_manager_backend.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    
    Page<Project> findByNameContainingIgnoreCaseAndStatus(String name, ProjectStatus status, Pageable pageable);

    Page<Project> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);

    List<Project> findByManagerId(UUID managerId);
}