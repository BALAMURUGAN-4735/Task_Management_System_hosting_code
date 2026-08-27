package com.projectmanagement.task_manager_backend.dto.request;

import com.projectmanagement.task_manager_backend.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record ProjectRequest(
    @NotBlank String name,
    String description,
    LocalDate startDate,
    LocalDate endDate,
    @NotNull ProjectStatus status,
    UUID managerId
) {}