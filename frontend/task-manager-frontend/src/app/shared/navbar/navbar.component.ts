import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service'; // <-- 1. Import UserService

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatToolbarModule, 
    MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  userName = '';
  role = '';
  unreadCount = 0;
  notifications: any[] = [];
  isDarkMode = false;
  userAvatarUrl = '';

  constructor(
    private authService: AuthService, 
    private userService: UserService, // <-- 2. Inject UserService here
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.role = this.authService.getRole() || '';
    this.loadRoleSpecificNotifications();
    this.initializeThemePreference();
  }

  initializeThemePreference(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    } else {
      this.isDarkMode = false;
      document.body.classList.remove('dark-mode');
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  onAvatarSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      // Backend automatically detects user via authentication token, pass only file
      this.userService.uploadAvatar(file).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.userAvatarUrl = res.imageUrl;
            alert('Profile picture updated successfully!');
          }
        },
        error: (err: any) => console.error('Error uploading avatar:', err)
      });
    }
  }

  loadRoleSpecificNotifications(): void {
    if (this.role === 'ROLE_ADMIN') {
      this.notifications = [
        { title: 'New Employee registration pending approval', time: '10 mins ago', type: 'warning', targetModule: 'users' },
        { title: 'Project Manager reassignment required for Cloud ERP', time: '1 hour ago', type: 'urgent', targetModule: 'projects' },
        { title: 'System audit logs updated', time: '2 hours ago', type: 'success', targetModule: 'audit' }
      ];
    } else if (this.role === 'ROLE_PROJECT_MANAGER') {
      this.notifications = [
        { title: 'New task assigned to Employee John', time: '15 mins ago', type: 'success' },
        { title: 'Task "Database Migration" overdue by 2 days', time: '45 mins ago', type: 'urgent' },
        { title: 'Project deadline updated by Admin', time: '3 hours ago', type: 'warning' }
      ];
    } else if (this.role === 'ROLE_EMPLOYEE') {
      this.notifications = [
        { title: 'New Task assigned: "Setup Spring Security"', time: '5 mins ago', type: 'warning' },
        { title: 'Task "UI Redesign" due in 24 hours', time: '30 mins ago', type: 'urgent' }
      ];
    } else {
      this.notifications = [];
    }

    this.unreadCount = this.notifications.length;
  }

  clearNotifications(): void {
    this.unreadCount = 0;
  }

  onNotificationClick(notification: any): void {
    if (this.unreadCount > 0) {
      this.unreadCount--;
    }
    
    if (this.role === 'ROLE_ADMIN' && notification.targetModule) {
      this.router.navigate(['/admin'], { queryParams: { module: notification.targetModule } });
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}