package com.projectmanagement.task_manager_backend.service;

import com.projectmanagement.task_manager_backend.dto.request.CommentRequest;
import com.projectmanagement.task_manager_backend.dto.request.TaskRequest;
import com.projectmanagement.task_manager_backend.dto.response.CommentDto;
import com.projectmanagement.task_manager_backend.dto.response.TaskDto;
import com.projectmanagement.task_manager_backend.entity.Comment;
import com.projectmanagement.task_manager_backend.entity.Project;
import com.projectmanagement.task_manager_backend.entity.Task;
import com.projectmanagement.task_manager_backend.entity.User;
import com.projectmanagement.task_manager_backend.enums.TaskPriority;
import com.projectmanagement.task_manager_backend.enums.TaskStatus;
import com.projectmanagement.task_manager_backend.exception.ResourceNotFoundException;
import com.projectmanagement.task_manager_backend.repository.CommentRepository;
import com.projectmanagement.task_manager_backend.repository.ProjectRepository;
import com.projectmanagement.task_manager_backend.repository.TaskRepository;
import com.projectmanagement.task_manager_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final AuditLogService auditLogService;

    public List<TaskDto> getAllTasks(String title, TaskStatus status, TaskPriority priority, UUID assignedUserId) {
        List<Task> tasks = taskRepository.findAll();

        return tasks.stream()
                .filter(t -> title == null || t.getTitle().toLowerCase().contains(title.toLowerCase()))
                .filter(t -> status == null || t.getStatus() == status)
                .filter(t -> priority == null || t.getPriority() == priority)
                .filter(t -> assignedUserId == null || (t.getAssignedUser() != null && t.getAssignedUser().getId().equals(assignedUserId)))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskById(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return mapToDto(task);
    }

    public TaskDto createTask(TaskRequest request) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        User assignedUser = null;
        if (request.assignedUserId() != null) {
            assignedUser = userRepository.findById(request.assignedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned User not found"));
        }

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .status(request.status())
                .priority(request.priority())
                .dueDate(request.dueDate())
                .assignedUser(assignedUser)
                .project(project)
                .build();

        Task savedTask = taskRepository.save(task);

        // Audit Log entry for task creation
        String currentUser = getCurrentUserEmail();
        String assignedName = assignedUser != null ? assignedUser.getName() : "Unassigned";
        auditLogService.logAction(
            "TASK_CREATED",
            currentUser,
            "Created task '" + savedTask.getTitle() + "' in project '" + project.getName() + "' (Assigned to: " + assignedName + ")"
        );

        return mapToDto(savedTask);
    }

    public TaskDto updateTask(UUID id, TaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (request.assignedUserId() != null) {
            User assignedUser = userRepository.findById(request.assignedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned User not found"));
            task.setAssignedUser(assignedUser);
        }

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());

        Task updated = taskRepository.save(task);

        // Audit Log entry for task update
        String currentUser = getCurrentUserEmail();
        auditLogService.logAction(
            "TASK_UPDATED",
            currentUser,
            "Updated task details for '" + updated.getTitle() + "'"
        );

        return mapToDto(updated);
    }

    public TaskDto updateTaskStatus(UUID taskId, TaskStatus newStatus) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        TaskStatus oldStatus = task.getStatus();
        task.setStatus(newStatus);
        Task updated = taskRepository.save(task);

        // Audit Log entry for Employee/PM status change
        String currentUser = getCurrentUserEmail();
        auditLogService.logAction(
            "TASK_STATUS_UPDATED",
            currentUser,
            "Changed task '" + task.getTitle() + "' status from " + oldStatus + " to " + newStatus
        );

        return mapToDto(updated);
    }

    public void deleteTask(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        taskRepository.deleteById(id);

        // Audit Log entry for task deletion
        String currentUser = getCurrentUserEmail();
        auditLogService.logAction(
            "TASK_DELETED",
            currentUser,
            "Deleted task '" + task.getTitle() + "'"
        );
    }

    public CommentDto addComment(CommentRequest request) {
        Task task = taskRepository.findById(request.taskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        String userEmail = getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .message(request.message())
                .createdBy(currentUser)
                .task(task)
                .build();

        Comment saved = commentRepository.save(comment);

        // Audit Log entry for comment creation
        auditLogService.logAction(
            "COMMENT_ADDED",
            userEmail,
            "Added comment on task '" + task.getTitle() + "'"
        );

        return new CommentDto(
                saved.getId(),
                saved.getMessage(),
                saved.getCreatedBy().getId(),
                saved.getCreatedBy().getName(),
                saved.getCreatedTime()
        );
    }

    public List<CommentDto> getTaskComments(UUID taskId) {
        return commentRepository.findByTaskIdOrderByCreatedTimeDesc(taskId).stream()
                .map(c -> new CommentDto(
                        c.getId(),
                        c.getMessage(),
                        c.getCreatedBy().getId(),
                        c.getCreatedBy().getName(),
                        c.getCreatedTime()))
                .collect(Collectors.toList());
    }

    public List<TaskDto> getTasksForManager(UUID managerId) {
        return taskRepository.findByProjectManagerId(managerId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private TaskDto mapToDto(Task t) {
        return new TaskDto(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getStatus(),
                t.getPriority(),
                t.getDueDate(),
                t.getAssignedUser() != null ? t.getAssignedUser().getId() : null,
                t.getAssignedUser() != null ? t.getAssignedUser().getName() : null,
                t.getProject().getId(),
                t.getProject().getName()
        );
    }

    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "SYSTEM";
    }
}