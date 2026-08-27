package com.projectmanagement.task_manager_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private long totalProjects;
    private long totalTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long overdueTasks;
    private long totalUsers;
}