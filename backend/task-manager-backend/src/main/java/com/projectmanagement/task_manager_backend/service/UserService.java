package com.projectmanagement.task_manager_backend.service;

import com.projectmanagement.task_manager_backend.entity.User;
import com.projectmanagement.task_manager_backend.enums.Role;
import com.projectmanagement.task_manager_backend.enums.UserStatus;
import com.projectmanagement.task_manager_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public List<User> getManagers() {
        return userRepository.findByRoleAndStatus(Role.ROLE_PROJECT_MANAGER, UserStatus.ACTIVE);
    }

    public List<User> getEmployees() {
        return userRepository.findByRoleAndStatus(Role.ROLE_EMPLOYEE, UserStatus.ACTIVE);
    }

    public List<User> getPendingUsers() {
        return userRepository.findByStatus(UserStatus.PENDING);
    }

    public void approveUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setStatus(UserStatus.ACTIVE);
        user.setActive(true);
        userRepository.save(user);

        // Audit Log entry for user approval
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String adminEmail = (auth != null && auth.isAuthenticated()) ? auth.getName() : "ADMIN";

        auditLogService.logAction(
            "USER_APPROVED", 
            adminEmail, 
            "Approved access request for " + user.getName() + " (" + user.getEmail() + ") with role " + user.getRole()
        );
    }

    public List<User> getAllUsers() {
    return userRepository.findAll();
}

public String uploadProfileImage(UUID userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        try {
            // Define upload directory (e.g., project root / uploads)
            String uploadDir = "uploads/avatars/";
            Path uploadPath = Paths.get(uploadDir);
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename to prevent conflicts
            String filename = userId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            
            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Save relative URL or path to user entity
            String imageUrl = "/uploads/avatars/" + filename;
            user.setProfileImage(imageUrl);
            userRepository.save(user);

            // Audit log entry
            auditLogService.logAction(
                "PROFILE_IMAGE_UPLOADED", 
                user.getEmail(), 
                "User " + user.getName() + " updated their profile picture."
            );

            return imageUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store profile image file.", e);
        }
    }
}