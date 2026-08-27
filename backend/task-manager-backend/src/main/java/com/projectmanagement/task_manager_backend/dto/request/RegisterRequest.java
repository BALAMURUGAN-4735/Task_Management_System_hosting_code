package com.projectmanagement.task_manager_backend.dto.request;

import com.projectmanagement.task_manager_backend.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
    @NotBlank String name,
    @NotBlank @Email String email,
    @NotBlank String password,
    @NotNull Role role
) {}