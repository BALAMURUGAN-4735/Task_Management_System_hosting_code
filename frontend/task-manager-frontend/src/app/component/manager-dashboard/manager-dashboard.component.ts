import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Task } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';
import { User } from '../../core/models/user.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatInputModule, 
    MatButtonModule, MatSelectModule, MatListModule, MatIconModule,
    MatProgressBarModule, MatTableModule, MatMenuModule, 
    MatDatepickerModule, MatNativeDateModule, NavbarComponent
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  viewMode: 'table' | 'kanban' = 'table';

  // MODAL VISIBILITY FLAGS
  showCreateModal = false;
  showReassignModal = false;
  showBulkModal = false;

  // TASK DETAILS & DISCUSSION MODAL STATE
  selectedTaskForDetails: Task | null = null;
  showTaskDetailsModal = false;
  modalCommentText = '';
  modalCommentsList: any[] = [];

  // DATA COLLECTIONS
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  projects: Project[] = [];
  employees: User[] = [];

  dataSource = new MatTableDataSource<Task>([]);

  currentUserId = '';
  currentUserName = '';

  selectedProjectId: string = 'ALL';
  projectStats = {
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  };

  workloadSummary: { employeeName: string; taskCount: number; percentage: number; isOverloaded: boolean }[] = [];

  // REASSIGNMENT STATE
  selectedTaskToReassign: any = null;
  newAssignedEmployeeId = '';

  // ADVANCED FILTER TOOLBAR STATE
  filterSearchQuery = '';
  filterPriority = 'ALL';
  filterStatus = 'ALL';
  filterAssigneeId = 'ALL';

  // KANBAN STAGE TABS
  kanbanStageTab: 'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED' = 'ALL';

  // BULK EXCEL UPLOAD STATE
  parsedBulkTasks: any[] = [];
  bulkValidationErrors: string[] = [];
  isBulkUploadValid = false;
  uploadedFileName = '';

  // CREATE / EDIT TASK FORM MODEL
  newTask: any = {
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date(),
    projectId: '',
    assignedUserId: '',
    estimatedHours: 8,
    loggedHours: 0
  };

  constructor(
    private taskService: TaskService, 
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.extractActiveUserCredentials();

    forkJoin({
      employeesRes: this.userService.getEmployees(),
      projectsRes: this.projectService.getProjects(),
      tasksRes: this.taskService.getTasks()
    }).subscribe({
      next: ({ employeesRes, projectsRes, tasksRes }) => {
        this.ngZone.run(() => {
          if (employeesRes?.success && employeesRes.data) {
            this.employees = employeesRes.data;
          }

          if (projectsRes?.success && projectsRes.data) {
            this.projects = projectsRes.data.filter((p: any) => {
              const matchId = this.currentUserId && p.managerId && 
                String(p.managerId).toLowerCase() === String(this.currentUserId).toLowerCase();
              const matchName = this.currentUserName && p.managerName && 
                p.managerName.toLowerCase().trim() === this.currentUserName.toLowerCase().trim();
              return matchId || matchName;
            });
          }

          if (tasksRes?.success && tasksRes.data) {
            const pmProjectIds = this.projects.map(p => String(p.id));
            const allTasks = tasksRes.data;

            if (pmProjectIds.length === 0) {
              this.tasks = [];
            } else {
              this.tasks = allTasks
                .filter((t: any) => pmProjectIds.includes(String(t.projectId || t.project_id)))
                .map((t: any) => {
                  const matchedProj = this.projects.find(p => String(p.id) === String(t.projectId || t.project_id));
                  return {
                    ...t,
                    projectName: t.projectName || (matchedProj ? matchedProj.name : 'General Project'),
                    estimatedHours: t.estimatedHours || 8,
                    loggedHours: t.loggedHours || 0
                  };
                });
            }
          }

          this.applyProjectFilter();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error loading PM dashboard data:', err)
    });
  }

  private extractActiveUserCredentials(): void {
    const authName = this.authService.getUserName ? this.authService.getUserName() : '';
    const authId = this.authService.getUserId ? this.authService.getUserId() : '';

    if (authName) this.currentUserName = authName;
    if (authId) this.currentUserId = authId;

    const token = localStorage.getItem('token') || localStorage.getItem('jwt');
    if (token && (!this.currentUserId || !this.currentUserName)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.name && !this.currentUserName) this.currentUserName = payload.name;
        if (payload.id || payload.userId) this.currentUserId = payload.id || payload.userId;
      } catch (e) {}
    }

    if (!this.currentUserName || !this.currentUserId) {
      const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (!this.currentUserName && (u.name || u.username)) this.currentUserName = u.name || u.username;
          if (!this.currentUserId && (u.id || u.userId)) this.currentUserId = u.id || u.userId;
        } catch (e) {}
      }
    }
  }

  // --- TASK DETAILS MODAL METHODS ---
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

  isOverdue(task: Task): boolean {
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today && task.status !== 'COMPLETED';
  }

  // --- DYNAMIC PROJECT & ADVANCED FILTER TOOLBAR ---
  applyProjectFilter(): void {
    let result = [...this.tasks];

    if (this.selectedProjectId !== 'ALL') {
      result = result.filter(t => String(t.projectId) === String(this.selectedProjectId));
    }

    if (this.filterSearchQuery.trim()) {
      const q = this.filterSearchQuery.toLowerCase().trim();
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (this.filterPriority !== 'ALL') {
      result = result.filter(t => t.priority === this.filterPriority);
    }

    if (this.filterStatus !== 'ALL') {
      result = result.filter(t => t.status === this.filterStatus);
    }

    if (this.filterAssigneeId !== 'ALL') {
      result = result.filter(t => t.assignedUserId === this.filterAssigneeId || t.assignedUserName === this.filterAssigneeId);
    }

    this.filteredTasks = result;
    this.dataSource.data = this.filteredTasks;
    this.calculateMetrics();
    this.calculateWorkload();
    this.cdr.detectChanges();
  }

  resetAdvancedFilters(): void {
    this.filterSearchQuery = '';
    this.filterPriority = 'ALL';
    this.filterStatus = 'ALL';
    this.filterAssigneeId = 'ALL';
    this.selectedProjectId = 'ALL';
    this.applyProjectFilter();
  }

  calculateMetrics(): void {
    const today = new Date().toISOString().split('T')[0];
    this.projectStats.total = this.filteredTasks.length;
    this.projectStats.inProgress = this.filteredTasks.filter(t => t.status === 'IN_PROGRESS').length;
    this.projectStats.completed = this.filteredTasks.filter(t => t.status === 'COMPLETED').length;
    this.projectStats.overdue = this.filteredTasks.filter(t => t.dueDate < today && t.status !== 'COMPLETED').length;
  }

  calculateWorkload(): void {
    if (this.employees.length === 0) return;

    const totalTaskCount = this.filteredTasks.length || 1;
    this.workloadSummary = this.employees.map(emp => {
      const assignedCount = this.filteredTasks.filter(t => t.assignedUserId === emp.id || t.assignedUserName === emp.name).length;
      return {
        employeeName: emp.name,
        taskCount: assignedCount,
        percentage: Math.min(Math.round((assignedCount / totalTaskCount) * 100), 100),
        isOverloaded: assignedCount >= 3
      };
    });
  }

  getTasksByStatus(status: string): Task[] {
    return this.filteredTasks.filter(t => t.status === status);
  }

  updateTaskStatus(task: Task, newStatus: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.taskService.updateTask(task.id!, { ...task, status: newStatus as any }).subscribe(() => {
      this.loadDashboardData();
    });
  }

  // --- NATIVE EXCEL DROPDOWNS GENERATOR (EXCELJS) ---
  openBulkModal(): void {
    this.showBulkModal = true;
    this.parsedBulkTasks = [];
    this.bulkValidationErrors = [];
    this.isBulkUploadValid = false;
    this.uploadedFileName = '';
  }

  closeBulkModal(): void {
    this.showBulkModal = false;
  }

  async downloadExcelTemplate(): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();

      const mainSheet = workbook.addWorksheet('Task_Import_Format');
      const refSheet = workbook.addWorksheet('Database_Allowed_Values');

      const headerRow = mainSheet.addRow(['Title', 'Description', 'ProjectName', 'AssigneeName', 'Priority', 'Status', 'DueDate', 'EstimatedHours']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0F172A' }
        };
      });

      mainSheet.getColumn(1).width = 30;
      mainSheet.getColumn(2).width = 40;
      mainSheet.getColumn(3).width = 25;
      mainSheet.getColumn(4).width = 25;
      mainSheet.getColumn(5).width = 15;
      mainSheet.getColumn(6).width = 15;
      mainSheet.getColumn(7).width = 18;
      mainSheet.getColumn(8).width = 18;

      refSheet.getCell('A1').value = 'Available Projects';
      refSheet.getCell('A1').font = { bold: true };
      this.projects.forEach((p, idx) => {
        refSheet.getCell(`A${idx + 2}`).value = p.name;
      });

      refSheet.getCell('C1').value = 'Available Team Members';
      refSheet.getCell('C1').font = { bold: true };
      this.employees.forEach((e, idx) => {
        refSheet.getCell(`C${idx + 2}`).value = e.name;
      });

      const projMaxRow = Math.max(this.projects.length + 1, 2);
      const empMaxRow = Math.max(this.employees.length + 1, 2);

      const projFormula = `Database_Allowed_Values!$A$2:$A$${projMaxRow}`;
      const empFormula = `Database_Allowed_Values!$C$2:$C$${empMaxRow}`;

      for (let row = 2; row <= 50; row++) {
        mainSheet.getCell(row, 3).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [projFormula]
        };

        mainSheet.getCell(row, 4).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [empFormula]
        };

        mainSheet.getCell(row, 5).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"LOW,MEDIUM,HIGH,URGENT"']
        };

        mainSheet.getCell(row, 6).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"TODO,IN_PROGRESS,COMPLETED"']
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Clean_Task_Import_Template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error('Error generating native Excel template:', err);
    }
  }

  onFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadedFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      this.parseAndValidateRows(jsonRows);
    };

    reader.readAsArrayBuffer(file);
  }

  parseAndValidateRows(rows: any[]): void {
    this.parsedBulkTasks = [];
    this.bulkValidationErrors = [];

    const filledEntries = rows.filter(r => 
      (r['Title'] || r['title'] || '').toString().trim() !== '' ||
      (r['ProjectName'] || r['projectName'] || r['Project'] || '').toString().trim() !== ''
    );

    if (!filledEntries || filledEntries.length === 0) {
      this.bulkValidationErrors.push('Uploaded file contains no filled task rows.');
      this.isBulkUploadValid = false;
      return;
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

    filledEntries.forEach((row, idx) => {
      const rowNum = idx + 2;
      const title = (row['Title'] || row['title'] || '').toString().trim();
      const description = (row['Description'] || row['description'] || '').toString().trim();
      const projectName = (row['ProjectName'] || row['projectName'] || row['Project'] || '').toString().trim();
      const assigneeName = (row['AssigneeName'] || row['assigneeName'] || row['Assignee'] || '').toString().trim();
      const priority = (row['Priority'] || row['priority'] || 'MEDIUM').toString().trim().toUpperCase();
      const status = (row['Status'] || row['status'] || 'TODO').toString().trim().toUpperCase();
      const dueDateRaw = row['DueDate'] || row['dueDate'] || new Date().toISOString().split('T')[0];
      const estimatedHours = parseInt(row['EstimatedHours'] || row['estimatedHours'] || '8') || 8;

      let rowHasError = false;

      if (!title) {
        this.bulkValidationErrors.push(`Row ${rowNum}: Task Title cannot be empty.`);
        rowHasError = true;
      }

      const matchedProject = this.projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (!matchedProject) {
        this.bulkValidationErrors.push(`Row ${rowNum}: Project '${projectName}' not found.`);
        rowHasError = true;
      }

      const matchedUser = this.employees.find(e => e.name.toLowerCase() === assigneeName.toLowerCase());
      if (!matchedUser) {
        this.bulkValidationErrors.push(`Row ${rowNum}: Assignee '${assigneeName}' not found.`);
        rowHasError = true;
      }

      if (!validPriorities.includes(priority)) {
        this.bulkValidationErrors.push(`Row ${rowNum}: Priority '${priority}' is invalid.`);
        rowHasError = true;
      }

      if (!validStatuses.includes(status)) {
        this.bulkValidationErrors.push(`Row ${rowNum}: Status '${status}' is invalid.`);
        rowHasError = true;
      }

      if (!rowHasError) {
        this.parsedBulkTasks.push({
          title,
          description,
          projectId: matchedProject?.id,
          projectName: matchedProject?.name,
          assignedUserId: matchedUser?.id,
          assignedUserName: matchedUser?.name,
          priority,
          status,
          dueDate: typeof dueDateRaw === 'string' ? dueDateRaw : new Date(dueDateRaw).toISOString().split('T')[0],
          estimatedHours
        });
      }
    });

    this.isBulkUploadValid = this.bulkValidationErrors.length === 0 && this.parsedBulkTasks.length > 0;
    this.cdr.detectChanges();
  }

  submitBulkTasks(): void {
    if (!this.isBulkUploadValid || this.parsedBulkTasks.length === 0) return;

    const requests = this.parsedBulkTasks.map(t => this.taskService.createTask(t));
    forkJoin(requests).subscribe(() => {
      this.loadDashboardData();
      this.closeBulkModal();
    });
  }

  openCreateModal(task?: Task): void { 
    if (task) {
      this.newTask = { ...task }; // Pre-fill with existing task data for editing
    } else {
      this.newTask = {
        title: '', description: '', status: 'TODO', priority: 'MEDIUM',
        dueDate: new Date(), projectId: '', assignedUserId: '',
        estimatedHours: 8, loggedHours: 0
      };
    }
    this.showCreateModal = true; 
  }

  closeCreateModal(): void { 
    this.showCreateModal = false; 
  }

  saveTask(): void {
    const formattedTask = {
      ...this.newTask,
      dueDate: this.newTask.dueDate instanceof Date 
        ? this.newTask.dueDate.toISOString().split('T')[0] 
        : this.newTask.dueDate
    };

    if (this.newTask.id) {
      this.taskService.updateTask(this.newTask.id, formattedTask).subscribe(() => {
        this.loadDashboardData();
        this.closeCreateModal();
      });
    } else {
      this.taskService.createTask(formattedTask).subscribe(() => {
        this.loadDashboardData();
        this.closeCreateModal();
      });
    }
  }

  openReassignModal(task: Task, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedTaskToReassign = task;
    this.newAssignedEmployeeId = task.assignedUserId || '';
    this.showReassignModal = true;
  }

  closeReassignModal(): void {
    this.showReassignModal = false;
    this.selectedTaskToReassign = null;
  }

  confirmReassignment(): void {
    if (this.selectedTaskToReassign && this.newAssignedEmployeeId) {
      this.taskService.updateTask(this.selectedTaskToReassign.id, {
        ...this.selectedTaskToReassign,
        assignedUserId: this.newAssignedEmployeeId
      }).subscribe(() => {
        this.loadDashboardData();
        this.closeReassignModal();
      });
    }
  }
}