import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { Task } from '../../core/models/task.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatInputModule, 
    MatButtonModule, MatSelectModule, MatIconModule, MatProgressBarModule,
    MatBadgeModule, MatTooltipModule, NavbarComponent
  ],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.css']
})
export class EmployeeDashboardComponent implements OnInit {
  viewMode: 'grid' | 'kanban' = 'grid';

  currentUserId = '';
  currentUserEmail = '';
  currentUserName = '';
  currentUserRole = 'EMPLOYEE';

  allAssignedTasks: Task[] = [];
  filteredTasks: Task[] = [];

  selectedTaskForDetails: Task | null = null;
  showTaskDetailsModal = false;
  modalCommentText = '';
  modalCommentsList: any[] = [];

  stats = {
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  };
  weeklyCapacity = {
    logged: 0,
    target: 40
  };

  searchQuery = '';
  selectedPriority = 'ALL';
  selectedStatus = 'ALL';

  commentMessages: { [taskId: string]: string } = {};
  taskCommentsMap: { [taskId: string]: any[] } = {};
  showCommentsMap: { [taskId: string]: boolean } = {};
  logHoursMap: { [taskId: string]: number } = {};

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.extractUserCredentials();
    this.loadEmployeeTasks();
  }

  private extractUserCredentials(): void {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        this.currentUserId = u.id || u.userId || '';
        this.currentUserEmail = u.email || '';
        this.currentUserName = u.name || u.username || u.fullName || '';
        this.currentUserRole = u.role || 'EMPLOYEE';
      } catch (e) {}
    }

    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!this.currentUserId) this.currentUserId = payload.id || payload.userId || payload.sub || '';
        if (!this.currentUserEmail) this.currentUserEmail = payload.email || payload.sub || '';
        if (!this.currentUserName) this.currentUserName = payload.name || payload.username || payload.fullName || '';
      } catch (e) {}
    }

    if (!this.currentUserName && this.currentUserEmail) {
      this.currentUserName = this.currentUserEmail.split('@')[0].replace('.', ' ');
    }
  }

  loadEmployeeTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          const rawTasks: any[] = res?.data ? res.data : (Array.isArray(res) ? res : []);
          const loggedName = (this.currentUserName || 'john').toLowerCase().trim();
          const nameFirstName = loggedName.split(' ')[0];
          const loggedId = String(this.currentUserId).toLowerCase().trim();

          let matched = rawTasks.filter((t: any) => {
            const taskUserId = t.assignedUserId ? String(t.assignedUserId).toLowerCase().trim() : '';
            const taskUserName = t.assignedUserName ? t.assignedUserName.toLowerCase().trim() : '';
            const matchId = loggedId && taskUserId && taskUserId === loggedId;
            const matchFullName = taskUserName && (taskUserName.includes(loggedName) || loggedName.includes(taskUserName));
            const matchFirstName = taskUserName && nameFirstName && taskUserName.includes(nameFirstName);
            return matchId || matchFullName || matchFirstName;
          });

          if (matched.length === 0 && rawTasks.length > 0) {
            matched = rawTasks.filter((t: any) => t.assignedUserName || t.assignedUserId);
          }

          this.allAssignedTasks = matched.map((t: any) => ({
            ...t,
            estimatedHours: t.estimatedHours || 8,
            loggedHours: t.loggedHours || (t.status === 'COMPLETED' ? (t.estimatedHours || 8) : 2)
          }));

          this.applyFilters();
          this.calculateWeeklyCapacity();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error fetching employee tasks:', err)
    });
  }

  applyFilters(): void {
    let result = [...this.allAssignedTasks];
    const today = new Date().toISOString().split('T')[0];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.projectName && t.projectName.toLowerCase().includes(q))
      );
    }

    if (this.selectedPriority !== 'ALL') {
      result = result.filter(t => t.priority === this.selectedPriority);
    }

    if (this.selectedStatus !== 'ALL') {
      if (this.selectedStatus === 'OVERDUE') {
        result = result.filter(t => t.dueDate < today && t.status !== 'COMPLETED');
      } else {
        result = result.filter(t => t.status === this.selectedStatus);
      }
    }

    this.filteredTasks = result;
    this.calculateKPIs();
    this.cdr.detectChanges();
  }

  clearFilter(type: 'search' | 'priority' | 'status'): void {
    if (type === 'search') this.searchQuery = '';
    if (type === 'priority') this.selectedPriority = 'ALL';
    if (type === 'status') this.selectedStatus = 'ALL';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.selectedPriority = 'ALL';
    this.selectedStatus = 'ALL';
    this.applyFilters();
  }

  quickFilterByStatus(status: string): void {
    this.selectedStatus = this.selectedStatus === status ? 'ALL' : status;
    this.applyFilters();
  }

  calculateKPIs(): void {
    const today = new Date().toISOString().split('T')[0];
    this.stats.total = this.allAssignedTasks.length;
    this.stats.inProgress = this.allAssignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
    this.stats.completed = this.allAssignedTasks.filter(t => t.status === 'COMPLETED').length;
    this.stats.overdue = this.allAssignedTasks.filter(t => t.dueDate < today && t.status !== 'COMPLETED').length;
  }

  calculateWeeklyCapacity(): void {
    const totalLogged = this.allAssignedTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
    const totalEstimated = this.allAssignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 8), 0);
    this.weeklyCapacity.logged = totalLogged;
    this.weeklyCapacity.target = Math.max(totalEstimated, 40);
  }

  openTaskDetailsModal(task: Task, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedTaskForDetails = task;
    this.showTaskDetailsModal = true;
    if (task.id) {
      this.loadModalComments(task.id);
    }
  }

  closeTaskDetailsModal(): void {
    this.showTaskDetailsModal = false;
    this.selectedTaskForDetails = null;
    this.modalCommentText = '';
  }

  loadModalComments(taskId: string): void {
    this.taskService.getComments(taskId).subscribe((res: any) => {
      this.modalCommentsList = res?.data ? res.data : (Array.isArray(res) ? res : []);
      this.cdr.detectChanges();
    });
  }

  postModalComment(): void {
    if (!this.modalCommentText || !this.modalCommentText.trim() || !this.selectedTaskForDetails || !this.selectedTaskForDetails.id) return;
    this.taskService.addComment(this.selectedTaskForDetails.id, this.modalCommentText).subscribe(() => {
      this.modalCommentText = '';
      this.loadModalComments(this.selectedTaskForDetails!.id!);
    });
  }

  updateStatus(task: Task, newStatus: string, event?: Event): void {
    if (event) event.stopPropagation();
    const oldStatus = task.status;
    const updatedTask: Task = { 
      ...task, 
      status: newStatus as any,
      loggedHours: newStatus === 'COMPLETED' ? (task.estimatedHours || 8) : task.loggedHours
    };

    if (!task.id) return;

    this.taskService.updateTask(task.id, updatedTask).subscribe(() => {
      const systemNote = `System: Status changed from ${oldStatus} to ${newStatus}`;
      this.taskService.addComment(task.id!, systemNote).subscribe(() => {
        this.loadEmployeeTasks();
        if (this.selectedTaskForDetails && this.selectedTaskForDetails.id === task.id) {
          this.selectedTaskForDetails.status = newStatus as any;
          this.loadModalComments(task.id!);
        }
      });
    });
  }

  logTaskHours(task: Task, event?: Event): void {
    if (event) event.stopPropagation();
    const additionalHours = this.logHoursMap[task.id!] || 0;
    if (additionalHours <= 0 || !task.id) return;

    const currentLogged = task.loggedHours || 0;
    const newTotalLogged = currentLogged + additionalHours;
    const updatedTask: Task = { ...task, loggedHours: newTotalLogged };

    this.taskService.updateTask(task.id, updatedTask).subscribe(() => {
      const systemNote = `Logged +${additionalHours} hrs (Total: ${newTotalLogged} hrs)`;
      this.taskService.addComment(task.id!, systemNote).subscribe(() => {
        this.logHoursMap[task.id!] = 0;
        this.loadEmployeeTasks();
        if (this.selectedTaskForDetails && this.selectedTaskForDetails.id === task.id) {
          this.selectedTaskForDetails.loggedHours = newTotalLogged;
          this.loadModalComments(task.id!);
        }
      });
    });
  }

  toggleComments(taskId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.showCommentsMap[taskId] = !this.showCommentsMap[taskId];
    if (this.showCommentsMap[taskId]) {
      this.loadComments(taskId);
    }
  }

  loadComments(taskId: string): void {
    this.taskService.getComments(taskId).subscribe((res: any) => {
      this.taskCommentsMap[taskId] = res?.data ? res.data : (Array.isArray(res) ? res : []);
      this.cdr.detectChanges();
    });
  }

  postComment(taskId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const msg = this.commentMessages[taskId];
    if (!msg || !msg.trim()) return;

    this.taskService.addComment(taskId, msg).subscribe(() => {
      this.commentMessages[taskId] = '';
      this.loadComments(taskId);
    });
  }

  getUserRoleBadge(userName: string): string {
    const name = (userName || '').toLowerCase();
    if (name.includes('admin')) return 'ADMIN';
    if (name.includes('manager') || name.includes('sarah') || name.includes('pm')) return 'MANAGER';
    return 'EMPLOYEE';
  }

  getProgressPercentage(task: Task): number {
    if (task.status === 'COMPLETED') return 100;
    const logged = task.loggedHours || 0;
    const estimated = task.estimatedHours || 8;
    return Math.min(Math.round((logged / estimated) * 100), 100);
  }

  getCapacityPercentage(): number {
    if (this.weeklyCapacity.target === 0) return 0;
    return Math.min(Math.round((this.weeklyCapacity.logged / this.weeklyCapacity.target) * 100), 100);
  }

  isOverdue(task: Task): boolean {
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today && task.status !== 'COMPLETED';
  }

  getTasksByStatus(status: string): Task[] {
    return this.filteredTasks.filter(t => t.status === status);
  }
}