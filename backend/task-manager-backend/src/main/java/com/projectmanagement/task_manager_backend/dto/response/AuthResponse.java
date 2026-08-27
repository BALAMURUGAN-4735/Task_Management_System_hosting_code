package com.projectmanagement.task_manager_backend.dto.response;

import com.projectmanagement.task_manager_backend.enums.Role;
import java.util.UUID;

public record AuthResponse(
    String token,
    UUID userId,
    String name,
    String email,
    Role role
) {}