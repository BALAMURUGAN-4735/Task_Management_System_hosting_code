package com.projectmanagement.task_manager_backend.service;

import com.projectmanagement.task_manager_backend.dto.request.ProjectRequest;
import com.projectmanagement.task_manager_backend.dto.response.ProjectDto;
import com.projectmanagement.task_manager_backend.entity.Project;
import com.projectmanagement.task_manager_backend.entity.User;
import com.projectmanagement.task_manager_backend.enums.ProjectStatus;
import com.projectmanagement.task_manager_backend.exception.ResourceNotFoundException;
import com.projectmanagement.task_manager_backend.repository.ProjectRepository;
import com.projectmanagement.task_manager_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public Page<ProjectDto> getAllProjects(String name, ProjectStatus status, Pageable pageable) {
        Page<Project> projectsPage;
        if (name != null && status != null) {
            projectsPage = projectRepository.findByNameContainingIgnoreCaseAndStatus(name, status, pageable);
        } else if (name != null) {
            projectsPage = projectRepository.findByNameContainingIgnoreCase(name, pageable);
        } else if (status != null) {
            projectsPage = projectRepository.findByStatus(status, pageable);
        } else {
            projectsPage = projectRepository.findAll(pageable);
        }
        return projectsPage.map(this::mapToDto);
    }

    public ProjectDto getProjectById(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToDto(project);
    }

    public ProjectDto createProject(ProjectRequest request) {
        User manager = null;
        if (request.managerId() != null) {
            manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        }

        Project project = Project.builder()
                .name(request.name())
                .description(request.description())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(request.status())
                .manager(manager)
                .build();

        Project saved = projectRepository.save(project);
        auditLogService.logAction("PROJECT_CREATED", "ADMIN", "Created project: " + saved.getName());
        return mapToDto(saved);
    }

    public ProjectDto updateProject(UUID id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (request.managerId() != null) {
            User manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
            project.setManager(manager);
        } else {
            project.setManager(null);
        }

        project.setName(request.name());
        project.setDescription(request.description());
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());
        project.setStatus(request.status());

        Project updated = projectRepository.save(project);
        auditLogService.logAction("PROJECT_UPDATED", "ADMIN", "Updated project: " + updated.getName());
        return mapToDto(updated);
    }

    public ProjectDto assignManager(UUID projectId, UUID managerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + managerId));

        project.setManager(manager);
        Project updated = projectRepository.save(project);
        auditLogService.logAction("MANAGER_REASSIGNED", "ADMIN", "Assigned PM " + manager.getName() + " to project " + project.getName());
        return mapToDto(updated);
    }

    public void deleteProject(UUID id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
        auditLogService.logAction("PROJECT_DELETED", "ADMIN", "Deleted project ID: " + id);
    }

    private ProjectDto mapToDto(Project p) {
        return new ProjectDto(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getStartDate(),
                p.getEndDate(),
                p.getStatus(),
                p.getManager() != null ? p.getManager().getId() : null,
                p.getManager() != null ? p.getManager().getName() : null
        );
    }

    public List<ProjectDto> getProjectsForManager(UUID managerId) {
        return projectRepository.findByManagerId(managerId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
}