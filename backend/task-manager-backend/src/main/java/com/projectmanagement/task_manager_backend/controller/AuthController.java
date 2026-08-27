package com.projectmanagement.task_manager_backend.controller;

import com.projectmanagement.task_manager_backend.dto.request.AuthRequest;
import com.projectmanagement.task_manager_backend.dto.request.RegisterRequest;
import com.projectmanagement.task_manager_backend.dto.response.ApiResponse;
import com.projectmanagement.task_manager_backend.dto.response.AuthResponse;
import com.projectmanagement.task_manager_backend.entity.User;
import com.projectmanagement.task_manager_backend.repository.UserRepository;
import com.projectmanagement.task_manager_backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Registration submitted. Pending admin approval.", authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        // Use request.email() instead of request.getEmail() since AuthRequest is a record
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user != null && user.isBlocked()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Your account has been blocked. Reason: " + user.getBlockReason()));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", authService.login(request)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody Map<String, String> request) {
        authService.resetPassword(request.get("email"), request.get("newPassword"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Password updated successfully.", null));
    }
}