package com.projectmanagement.task_manager_backend.service;

import com.projectmanagement.task_manager_backend.entity.AuditLog;
import com.projectmanagement.task_manager_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Logs actions performed by ANY user (ADMIN, MANAGER, or EMPLOYEE).
     */
    public void logAction(String action, String performedBy, String details) {
        try {
            // Fallback to authenticated JWT user email if performedBy is not explicitly passed
            String actor = performedBy;
            if (actor == null || actor.isBlank() || actor.equalsIgnoreCase("ADMIN")) {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                    actor = auth.getName(); // Extracts email/username from JWT Context
                } else {
                    actor = "SYSTEM";
                }
            }

            AuditLog log = AuditLog.builder()
                    .action(action)
                    .performedBy(actor)
                    .details(details)
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Failed to record audit log: " + e.getMessage());
        }
    }
}