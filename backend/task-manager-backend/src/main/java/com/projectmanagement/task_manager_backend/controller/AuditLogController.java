package com.projectmanagement.task_manager_backend.controller;

import com.projectmanagement.task_manager_backend.entity.AuditLog;
import com.projectmanagement.task_manager_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    /**
     * GET /api/audit-logs
     * Returns all database audit logs wrapped in { success: true, data: [...] }
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllAuditLogs() {
        try {
            List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", logs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to retrieve audit logs: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/audit-logs
     * Creates a new audit log entry manually
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createAuditLog(@RequestBody AuditLog auditLog) {
        try {
            AuditLog savedLog = auditLogRepository.save(auditLog);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", savedLog);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to save audit log: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}