package com.projectmanagement.task_manager_backend.entity;

import com.projectmanagement.task_manager_backend.enums.AuthProvider;
import com.projectmanagement.task_manager_backend.enums.Role;
import com.projectmanagement.task_manager_backend.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor 
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING;

    @Builder.Default
    private boolean active = true;

    // PROFILE PICTURE
    private String profileImage;

    // NEW SECURITY BLOCK FIELDS
    @Builder.Default
    @Column(name = "is_blocked")
    private boolean isBlocked = false;

    @Column(name = "block_reason")
    private String blockReason;
}