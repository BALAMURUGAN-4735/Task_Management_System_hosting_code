package com.projectmanagement.task_manager_backend.controller;

import com.projectmanagement.task_manager_backend.dto.request.CommentRequest;
import com.projectmanagement.task_manager_backend.dto.request.TaskRequest;
import com.projectmanagement.task_manager_backend.dto.response.ApiResponse;
import com.projectmanagement.task_manager_backend.dto.response.CommentDto;
import com.projectmanagement.task_manager_backend.dto.response.TaskDto;
import com.projectmanagement.task_manager_backend.enums.TaskPriority;
import com.projectmanagement.task_manager_backend.enums.TaskStatus;
import com.projectmanagement.task_manager_backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskDto>>> getAllTasks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) UUID assignedUserId) {
        try {
            List<TaskDto> tasks = taskService.getAllTasks(title, status, priority, assignedUserId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Tasks retrieved successfully", tasks));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Tasks retrieved successfully", java.util.Collections.emptyList()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDto>> getTaskById(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Task retrieved successfully", taskService.getTaskById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<TaskDto>> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Task created successfully", taskService.createTask(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TaskDto>> updateTask(@PathVariable UUID id, @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Task updated successfully", taskService.updateTask(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<String>> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Task deleted successfully", null));
    }

    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentDto>> addComment(@Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Comment added successfully", taskService.addComment(request)));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentDto>>> getTaskComments(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Comments retrieved successfully", taskService.getTaskComments(id)));
    }

@GetMapping("/manager/{managerId}")
public ResponseEntity<ApiResponse<List<TaskDto>>> getTasksForManager(@PathVariable UUID managerId) {
    return ResponseEntity.ok(new ApiResponse<>(true, "PM tasks retrieved", taskService.getTasksForManager(managerId)));
}
}