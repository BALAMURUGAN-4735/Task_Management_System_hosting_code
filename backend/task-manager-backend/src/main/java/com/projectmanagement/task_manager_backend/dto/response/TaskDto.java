package com.projectmanagement.task_manager_backend.dto.response;

import com.projectmanagement.task_manager_backend.enums.TaskPriority;
import com.projectmanagement.task_manager_backend.enums.TaskStatus;
import java.time.LocalDate;
import java.util.UUID;

public record TaskDto(
    UUID id,
    String title,
    String description,
    TaskStatus status,
    TaskPriority priority,
    LocalDate dueDate,
    UUID assignedUserId,
    String assignedUserName,
    UUID projectId,
    String projectName
) {}