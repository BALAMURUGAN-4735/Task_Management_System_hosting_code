package com.projectmanagement.task_manager_backend.dto.response;

import com.projectmanagement.task_manager_backend.enums.ProjectStatus;
import java.time.LocalDate;
import java.util.UUID;

public record ProjectDto(
    UUID id,
    String name,
    String description,
    LocalDate startDate,
    LocalDate endDate,
    ProjectStatus status,
    UUID managerId,
    String managerName
) {}