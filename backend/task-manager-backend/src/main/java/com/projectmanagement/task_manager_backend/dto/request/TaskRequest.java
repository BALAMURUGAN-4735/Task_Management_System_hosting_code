package com.projectmanagement.task_manager_backend.dto.request;

import com.projectmanagement.task_manager_backend.enums.TaskPriority;
import com.projectmanagement.task_manager_backend.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record TaskRequest(
    @NotBlank String title,
    String description,
    @NotNull TaskStatus status,
    @NotNull TaskPriority priority,
    LocalDate dueDate,
    UUID assignedUserId,
    @NotNull UUID projectId
) {}