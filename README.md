# Task Management Suite

An enterprise-grade, full-stack task management and collaboration platform built with a secure **Spring Boot** backend and a modular **Angular** single-page application (SPA) frontend. Designed to streamline workflow organization across multiple organizational tiers with role-based access control, real-time tracking, and persistent dark mode capabilities.

---

## 📅 Project Duration
* **Timeline**: 07-08-2026 to 09-08-2026

---

## 🚀 Comprehensive Features & Module Breakdown

### 1. Core Architecture & Tech Stack
* **Frontend Application**: Built using Angular (Standalone Components), TypeScript, HTML5, CSS3, and Angular Material for a responsive, component-driven UI.
* **Backend Application**: Developed using Spring Boot 3.2.5, Spring Data JPA, Hibernate, and MySQL.
* **Build & Dependency Management**: Managed via Maven (`pom.xml`) with Java 21 compilation and Lombok boilerplate reduction.

### 2. Authentication & Security Module
* **Stateless JWT Authentication**: Secure token-based login and authorization filter (`JwtAuthenticationFilter`) intercepting requests to validate user sessions.
* **Google OAuth2 Social Login**: Integrated Spring Security OAuth2 Client supporting Google single sign-on (`/oauth2/authorization/google`).
* **Role-Based Access Control (RBAC)**: Method-level security (`@PreAuthorize`) and secured endpoints mapped to distinct security tiers.
* **CORS & Security Configuration**: Configured custom `CorsFilter` and `SecurityFilterChain` permitting public auth paths while protecting protected resources.

### 3. User Management & Profile Customization
* **User Status & Approvals**: Dynamic account states (`PENDING`, `ACTIVE`) managed by administrators.
* **Profile Picture Upload**: Multipart file upload service that stores avatar images locally (`/uploads/avatars/`) with static resource mapping via `WebConfig`.
* **Dynamic Navigation Profile Pill**: Displays user name, role badge, and instant profile image preview with a click-to-upload file picker overlay.

### 4. UI/UX & Theme Management
* **Dynamic Dark Mode**: Persistent theme toggling (`light_mode` / `dark_mode`) stored via `localStorage` and applied globally via CSS variables across all cards, containers, forms, and tables.
* **Interactive Notifications**: Role-specific notification dropdown drawer handling unread counters, timestamps, status indicators, and direct module navigation.

---

## 👥 Role-Specific Workflows & Control Centers

### 1. Admin Control Center (`ROLE_ADMIN`)
* **Dashboard Overview & Metrics**: Real-time KPI summaries tracking Total Projects (8), Active Projects (2), and Pending Requests (0).
* **System Overview & Quick Actions**: Shortcut panel for system-level execution including **Create Project**, **Bulk Import**, and **Review Approvals**.
* **Dedicated Administrative Navigation Sidebar**: Quick access modules for:
  * Dashboard Overview
  * System Projects management
  * User Approvals workflow
  * Project Team Allocation
  * User Security & Details tracking
  * Audit Logs monitoring

### 2. Project Manager Control Center (`ROLE_PROJECT_MANAGER`)
* **Assigned Project Filtering**: Dynamic project selector dropdown to scope the workspace view ("All Assigned Projects (3)").
* **Workspace Metrics & Task Counters**: Real-time metrics tracking Total Tasks (11), In Progress (3), Completed (2), and Overdue (3) tasks.
* **Action Toolbar**: Interactive buttons for Table View, Kanban Board, Bulk Upload Tasks, and Create & Assign Task.
* **Team Task Allocation & Capacity Monitor**: Visual status cards for each team member (e.g., Bob QA, Charlie DevOps, Diana Frontend, John Developer, Alice Designer) tracking active task loads and highlighting resource overload warnings.
* **Stage-based Task Filtering Tabs**: Filter workspace deliverables by All Stages, TODO (5), IN PROGRESS (3), and COMPLETED (2).

### 3. Employee Portal — Workspace (`ROLE_EMPLOYEE`)
* **Weekly Capacity Log**: Tracks personal workload utilization and logged hours against weekly capacity (e.g., "20 / 56 hrs").
* **Personal Task Status Counters**: Real-time counts for Total Assigned (7), In Progress (2), Completed (1), and Overdue Tasks (1).
* **Advanced Search & Filtering Toolbar**: Instant title/description search bar coupled with dropdown filters for All Priorities and All Statuses.
* **Interactive Task Cards**: 
  * View project context labels, priority pills (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), and time trackers (`2 / 8 hrs`).
  * Built-in Progress Bars (percentage completion).
  * Quick-action buttons to Log Time (+ hrs).
  * Inline dropdown status updaters (`TODO`, `IN_PROGRESS`, `COMPLETED`) with due date markers.
  * View Task Details & Discussion drawer triggers.
* **View Switcher**: Toggle between Grid View and Kanban Board layout perspectives.

---

## ⚙️ Getting Started & Installation

### Prerequisites
* Java Development Kit (JDK) 21+
* Node.js & npm (Angular CLI)
* MySQL Server

### 1. Backend Setup (Spring Boot)
1. Navigate to the backend directory:
   ```bash
   cd backend/task-manager-backend/task-manager-backend

2. Configure your MySQL database credentials in
   src/main/resources/application.properties:
     ```bash
      spring.datasource.url=jdbc:mysql://localhost:3306/task_manager_db?createDatabaseIfNotExist=true
      spring.datasource.username=root
      spring.datasource.password=your_password

3.Run the Spring Boot application using Maven:
 ```bash
     mvn clean spring-boot:run

4. Frontend Setup (Angular)
Navigate to the frontend directory:
 ```bash
   cd frontend/taskManagerFrontend

5. Install dependencies:
 ```bash
npm install

6. Run the development server:
 ```bash
ng serve
