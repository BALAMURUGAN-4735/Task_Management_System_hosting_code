package com.projectmanagement.task_manager_backend.config;

import com.projectmanagement.task_manager_backend.entity.AuditLog;
import com.projectmanagement.task_manager_backend.entity.Comment;
import com.projectmanagement.task_manager_backend.entity.Project;
import com.projectmanagement.task_manager_backend.entity.Task;
import com.projectmanagement.task_manager_backend.entity.User;
import com.projectmanagement.task_manager_backend.enums.AuthProvider;
import com.projectmanagement.task_manager_backend.enums.ProjectStatus;
import com.projectmanagement.task_manager_backend.enums.Role;
import com.projectmanagement.task_manager_backend.enums.TaskPriority;
import com.projectmanagement.task_manager_backend.enums.TaskStatus;
import com.projectmanagement.task_manager_backend.enums.UserStatus;
import com.projectmanagement.task_manager_backend.repository.AuditLogRepository;
import com.projectmanagement.task_manager_backend.repository.CommentRepository;
import com.projectmanagement.task_manager_backend.repository.ProjectRepository;
import com.projectmanagement.task_manager_backend.repository.TaskRepository;
import com.projectmanagement.task_manager_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // 1. Seed 1 Admin
            User admin = userRepository.save(User.builder()
                    .name("System Admin")
                    .email("admin@company.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ROLE_ADMIN)
                    .provider(AuthProvider.LOCAL)
                    .active(true)
                    .status(UserStatus.ACTIVE)
                    .build());

            // 2. Seed 3 Managers
            List<User> managers = new ArrayList<>();
            String[] managerNames = {"Sarah Manager", "David Manager", "Elena Manager"};
            for (int i = 0; i < managerNames.length; i++) {
                managers.add(userRepository.save(User.builder()
                        .name(managerNames[i])
                        .email("pm" + (i + 1) + "@company.com")
                        .password(passwordEncoder.encode("password123"))
                        .role(Role.ROLE_PROJECT_MANAGER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .status(UserStatus.ACTIVE)
                        .build()));
            }

            // 3. Seed 5 Employees
            List<User> employees = new ArrayList<>();
            String[] empNames = {"John Developer", "Alice Designer", "Bob QA", "Charlie DevOps", "Diana Frontend"};
            for (int i = 0; i < empNames.length; i++) {
                employees.add(userRepository.save(User.builder()
                        .name(empNames[i])
                        .email("emp" + (i + 1) + "@company.com")
                        .password(passwordEncoder.encode("password123"))
                        .role(Role.ROLE_EMPLOYEE)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .status(UserStatus.ACTIVE)
                        .build()));
            }

            // 4. Seed 8 Projects
            List<Project> projects = new ArrayList<>();
            String[] projectNames = {
                "Cloud ERP Transformation", "Mobile Banking App Redesign", 
                "AI-Powered Analytics Dashboard", "E-Commerce Microservices Migration", 
                "Cybersecurity Audit Suite", "Customer Support Portal", 
                "Automated CI/CD Pipeline", "Legacy Database Modernization"
            };
            ProjectStatus[] pStatuses = {ProjectStatus.ACTIVE, ProjectStatus.PLANNED, ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED};
            Random random = new Random();

            for (int i = 0; i < projectNames.length; i++) {
                projects.add(projectRepository.save(Project.builder()
                        .name(projectNames[i])
                        .description("Detailed description and scope objectives for " + projectNames[i])
                        .startDate(LocalDate.now().minusDays(random.nextInt(30)))
                        .endDate(LocalDate.now().plusMonths(random.nextInt(3) + 1))
                        .status(pStatuses[random.nextInt(pStatuses.length)])
                        .manager(managers.get(random.nextInt(managers.size())))
                        .build()));
            }

            // 5. Seed 25 Tasks
            TaskPriority[] priorities = {TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT};
            TaskStatus[] statuses = {TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.COMPLETED};
            
            String[] taskTitles = {
                "Configure Spring Security 6", "Design Material Dashboard UI", "Setup MySQL Database Cluster",
                "Implement JWT Token Refresh", "Write Unit Tests for AuthService", "Figma Mobile Wireframes",
                "Setup Docker Containers", "API Gateway Integration", "Refactor Legacy Service Layer",
                "Optimize SQL Query Performance", "Setup Redis Caching", "Implement OAuth2 Google Login",
                "Create Audit Log Interceptor", "Build User Management Screen", "Design Error Handling Middleware",
                "Write End-to-End Cypress Tests", "Configure Nginx Reverse Proxy", "Setup SonarQube Code Quality",
                "Implement Role-Based UI Guards", "Create Project Export to PDF feature", "Write Deployment Documentation",
                "Setup Automated Slack Notifications", "Fix CORS Header Issues", "Perform Load Testing with JMeter",
                "Final Security Penetration Review"
            };

            for (int i = 0; i < taskTitles.length; i++) {
                Project assignedProject = projects.get(random.nextInt(projects.size()));
                User assignedEmployee = employees.get(random.nextInt(employees.size()));

                Task savedTask = taskRepository.save(Task.builder()
                        .title(taskTitles[i])
                        .description("Task execution details for: " + taskTitles[i])
                        .status(statuses[random.nextInt(statuses.length)])
                        .priority(priorities[random.nextInt(priorities.length)])
                        .dueDate(LocalDate.now().plusDays(random.nextInt(20) - 5))
                        .assignedUser(assignedEmployee)
                        .project(assignedProject)
                        .build());

                // Seed Comments
                commentRepository.save(Comment.builder()
                        .message("Initial requirements posted for this task.")
                        .task(savedTask)
                        .createdBy(managers.get(random.nextInt(managers.size())))
                        .createdTime(LocalDateTime.now().minusHours(5))
                        .build());

                commentRepository.save(Comment.builder()
                        .message("Working on implementation now. Will update soon.")
                        .task(savedTask)
                        .createdBy(assignedEmployee)
                        .createdTime(LocalDateTime.now().minusHours(2))
                        .build());
            }
        }

        // 6. Seed Audit Logs independently (Runs even if users already exist)
        if (auditLogRepository.count() == 0) {
            auditLogRepository.save(AuditLog.builder()
                    .action("USER_LOGIN")
                    .details("Admin user admin@company.com logged in successfully")
                    .performedBy("admin@company.com")
                    .timestamp(LocalDateTime.now().minusMinutes(45))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .action("PROJECT_CREATED")
                    .details("Created new project: Cloud ERP Transformation")
                    .performedBy("admin@company.com")
                    .timestamp(LocalDateTime.now().minusHours(2))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .action("TASK_ASSIGNED")
                    .details("Task 'Configure Spring Security 6' assigned to emp1@company.com")
                    .performedBy("pm1@company.com")
                    .timestamp(LocalDateTime.now().minusHours(1))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .action("STATUS_UPDATE")
                    .details("Task status updated to IN_PROGRESS")
                    .performedBy("emp1@company.com")
                    .timestamp(LocalDateTime.now().minusMinutes(20))
                    .build());
        }
    }
}