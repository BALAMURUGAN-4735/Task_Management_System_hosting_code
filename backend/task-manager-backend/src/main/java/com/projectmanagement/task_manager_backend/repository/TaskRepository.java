package com.projectmanagement.task_manager_backend.repository;

import com.projectmanagement.task_manager_backend.entity.Task;
import com.projectmanagement.task_manager_backend.enums.TaskPriority;
import com.projectmanagement.task_manager_backend.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByAssignedUserId(UUID assignedUserId);

    List<Task> findByProjectId(UUID projectId);

    List<Task> findByProjectManagerId(UUID managerId);

    // Added to support DashboardService metrics
    long countByStatus(TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.dueDate < :today AND t.status != 'COMPLETED'")
    long countOverdueTasks(@Param("today") LocalDate today);
}