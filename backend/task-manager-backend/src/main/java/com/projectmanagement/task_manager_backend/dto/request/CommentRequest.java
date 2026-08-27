package com.projectmanagement.task_manager_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CommentRequest(
    @NotBlank String message,
    @NotNull UUID taskId
) {}