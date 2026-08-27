package com.projectmanagement.task_manager_backend.controller;

import com.projectmanagement.task_manager_backend.dto.response.ApiResponse;
import com.projectmanagement.task_manager_backend.entity.User;
import com.projectmanagement.task_manager_backend.repository.UserRepository;
import com.projectmanagement.task_manager_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(new ApiResponse<>(true, "All users retrieved successfully", userService.getAllUsers()));
    }

    @GetMapping("/managers")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<List<User>>> getManagers() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Managers retrieved", userService.getManagers()));
    }

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<List<User>>> getEmployees() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Employees retrieved", userService.getEmployees()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getPendingUsers() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending users retrieved", userService.getPendingUsers()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> approveUser(@PathVariable UUID id) {
        userService.approveUser(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "User account approved successfully", null));
    }

    @PutMapping("/{id}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> blockUser(
            @PathVariable("id") UUID id, 
            @RequestBody Map<String, String> request) {
        
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setBlocked(true);
        user.setBlockReason(request.get("reason"));
        user.setActive(false);
        userRepository.save(user);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "User blocked successfully", null));
    }

    @PutMapping("/{id}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> unblockUser(@PathVariable("id") UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setBlocked(false);
        user.setBlockReason(null);
        user.setActive(true);
        userRepository.save(user);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "User unblocked successfully", null));
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            org.springframework.security.core.Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            String principal = authentication.getName();
            User user = userRepository.findByEmail(principal).orElse(null);
            if (user == null) {
                try {
                    UUID uuid = UUID.fromString(principal);
                    user = userRepository.findById(uuid).orElse(null);
                } catch (IllegalArgumentException ignored) {}
            }

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found"));
            }

            String imageUrl = userService.uploadProfileImage(user.getId(), file);
            return ResponseEntity.ok(Map.of("success", true, "imageUrl", imageUrl));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}