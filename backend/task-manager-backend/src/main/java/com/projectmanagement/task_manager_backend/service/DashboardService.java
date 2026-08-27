package com.projectmanagement.task_manager_backend.service;

import com.projectmanagement.task_manager_backend.dto.response.DashboardSummaryDto;
import com.projectmanagement.task_manager_backend.enums.TaskStatus;
import com.projectmanagement.task_manager_backend.repository.ProjectRepository;
import com.projectmanagement.task_manager_backend.repository.TaskRepository;
import com.projectmanagement.task_manager_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public DashboardSummaryDto getAdminDashboardMetrics() {
        return DashboardSummaryDto.builder()
                .totalProjects(projectRepository.count())
                .totalTasks(taskRepository.count())
                .completedTasks(taskRepository.countByStatus(TaskStatus.COMPLETED))
                .inProgressTasks(taskRepository.countByStatus(TaskStatus.IN_PROGRESS))
                .overdueTasks(taskRepository.countOverdueTasks(LocalDate.now()))
                .totalUsers(userRepository.count())
                .build();
    }

    public DashboardSummaryDto getSummary() {
        return getAdminDashboardMetrics();
    }
}