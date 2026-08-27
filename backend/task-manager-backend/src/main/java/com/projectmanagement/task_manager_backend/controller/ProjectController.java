package com.projectmanagement.task_manager_backend.controller;

import com.projectmanagement.task_manager_backend.dto.request.ProjectRequest;
import com.projectmanagement.task_manager_backend.dto.response.ApiResponse;
import com.projectmanagement.task_manager_backend.dto.response.ProjectDto;
import com.projectmanagement.task_manager_backend.enums.ProjectStatus;
import com.projectmanagement.task_manager_backend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getAllProjects(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) ProjectStatus status) {
        // Return as a clean list to match frontend expectations cleanly
        return ResponseEntity.ok(new ApiResponse<>(true, "Projects retrieved successfully", 
            projectService.getAllProjects(name, status, org.springframework.data.domain.Pageable.unpaged()).getContent()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> getProjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Project retrieved successfully", projectService.getProjectById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Project created successfully", projectService.createProject(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(@PathVariable UUID id, @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Project updated successfully", projectService.updateProject(id, request)));
    }

    @PutMapping("/{id}/assign-manager/{managerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDto>> assignManager(@PathVariable UUID id, @PathVariable UUID managerId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Project manager assigned successfully", projectService.assignManager(id, managerId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Project deleted successfully", null));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getProjectsForManager(@PathVariable UUID managerId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "PM projects retrieved", projectService.getProjectsForManager(managerId)));
    }
}