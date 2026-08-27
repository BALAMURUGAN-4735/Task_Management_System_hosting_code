package com.projectmanagement.task_manager_backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentDto(
    UUID id,
    String message,
    UUID createdById,
    String createdByName,
    LocalDateTime createdTime
) {}