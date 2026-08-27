package com.projectmanagement.task_manager_backend.repository;

import com.projectmanagement.task_manager_backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    
    // Fetches all audit logs ordered so the newest activity appears first
    List<AuditLog> findAllByOrderByTimestampDesc();
}