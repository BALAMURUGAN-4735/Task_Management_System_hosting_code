package com.projectmanagement.task_manager_backend.repository;

import com.projectmanagement.task_manager_backend.entity.User;
import com.projectmanagement.task_manager_backend.enums.Role;
import com.projectmanagement.task_manager_backend.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleAndStatus(Role role, UserStatus status);
    List<User> findByStatus(UserStatus status);
}