package com.projectmanagement.task_manager_backend.controller;

import com.projectmanagement.task_manager_backend.dto.response.ApiResponse;
import com.projectmanagement.task_manager_backend.dto.response.DashboardSummaryDto;
import com.projectmanagement.task_manager_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard summary loaded", dashboardService.getSummary()));
    }
}