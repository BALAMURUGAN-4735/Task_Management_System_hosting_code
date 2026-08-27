import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';

import { ProjectService } from '../../core/services/project.service';
import { UserService } from '../../core/services/user.service';
import { TaskService } from '../../core/services/task.service';
import { ExportService } from '../../core/services/export.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { Project } from '../../core/models/project.model';
import { Task } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatInputModule, 
    MatButtonModule, MatSelectModule, MatTableModule, MatIconModule, 
    MatSidenavModule, MatListModule, MatProgressBarModule, MatMenuModule, NavbarComponent, MatPaginatorModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  activeModule = 'dashboard';

  showCreateModal = false;
  showReassignModal = false;
  showExtendDurationModal = false;
  showBulkUploadModal = false;
  showAuditExportModal = false;

  // Project Team Allocation Module State
  showTeamAllocationModal = false;
  isEditingAllocation = false;
  editingAllocationId: string | null = null;
  
  // Dynamic Team Allocations mapped from projects
 allocatedTeamsList: any[] = [
    { 
      id: 1, 
      projectName: 'Cloud ERP Transformation', 
      managerName: 'Sarah Manager', 
      employees: ['John Developer', 'Alice Designer'] 
    },
    { 
      id: 2, 
      projectName: 'Mobile Banking App Redesign', 
      managerName: 'David Manager', 
      employees: ['Bob QA', 'Charlie DevOps'] 
    }
  ];
  
  newAllocationForm = {
    projectId: '',
    projectName: '',
    managerId: '',
    managerName: '',
    employeeId: ''
  };

  selectedTeamEmployeesCart: string[] = [];

  showBlockUserModal = false;
  selectedUserToBlock: any = null;
  selectedBlockReason = 'Security Policy Violation';
  blockReasonOptions = [
    'Security Policy Violation',
    'Suspicious Login Activity',
    'Project Inactivity / Contract End',
    'Direct Administrative Suspension'
  ];

  selectedProjectForDetails: any | null = null;
  showProjectDetailsModal = false;
  projectAssociatedTasks: Task[] = [];

  selectedTaskForDetails: Task | null = null;
  showTaskDetailsModal = false;
  modalCommentText = '';
  modalCommentsList: any[] = [];

  projects: any[] = [];
  filteredProjects: any[] = [];
  projectSearchQuery = '';
  selectedManagerFilter = 'ALL';
  selectedStatusFilter = 'ALL';

  managers: User[] = [];
  employeesList: User[] = [];
  allSystemUsers: any[] = [];
  filteredSystemUsers: any[] = [];
  userManagementSearchQuery = '';
  selectedUserStatusFilter = 'ALL Users'; 
  selectedUserRoleFilter = 'ALL';

  selectedProjectToReassign: Project | null = null;
  newSelectedManagerId = '';
  selectedReasonPreset = 'Workload Balancing';
  customReasonText = '';
  reassignReasonPresets = [
    'Workload Balancing',
    'Project Scope Expansion',
    'Manager Availability/Leave',
    'Skillset Alignment',
    'Performance Optimization',
    'Other'
  ];

  selectedProjectToExtend: Project | null = null;
  newStartDate = '';
  newEndDate = '';

  parsedBulkRows: any[] = [];
  bulkValidationErrors: string[] = [];

  pendingUsers: User[] = [];
  filteredPendingUsers: User[] = [];
  userSearchQuery = '';
  selectedRoleFilter = 'ALL';

  auditLogs: any[] = [];
  filteredAuditLogs: any[] = [];
  auditSearchQuery = '';
  selectedActionFilter = 'ALL';
  selectedAuditYear = 'ALL';
  selectedAuditMonth = 'ALL';
  yearsList = ['2024', '2025', '2026', '2027'];
  monthsList = [
    { name: 'All Months', val: 'ALL' },
    { name: 'January', val: '0' },
    { name: 'February', val: '1' },
    { name: 'March', val: '2' },
    { name: 'April', val: '3' },
    { name: 'May', val: '4' },
    { name: 'June', val: '5' },
    { name: 'July', val: '6' },
    { name: 'August', val: '7' },
    { name: 'September', val: '8' },
    { name: 'October', val: '9' },
    { name: 'November', val: '10' },
    { name: 'December', val: '11' }
  ];

  auditExportFormat: 'EXCEL' | 'PDF' = 'EXCEL';
  exportFromDate = '';
  exportToDate = '';

  totalProjects = 0;
  activeProjects = 0;
  pendingRequests = 0;
  totalTasksCount = 0;
  completedTasksCount = 0;
  overdueTasksCount = 0;

  newProject: any = {
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'PLANNED',
    managerId: ''
  };

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private taskService: TaskService,
    private exportService: ExportService,
    private auditLogService: AuditLogService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['module']) {
        this.activeModule = params['module'];
      }
    });
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // 1. Fetch Projects and map them with distinct rotating team members from the employee pool
    this.projectService.getProjects().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.projects = res.data.map((p: any) => ({
            ...p,
            startDate: p.startDate || p.start_date || p.createdAt || '',
            endDate: p.endDate || p.end_date || '',
            progress: p.status === 'COMPLETED' ? 100 : p.status === 'ACTIVE' ? 50 : 10
          }));
          this.applyProjectFilters();
          this.totalProjects = this.projects.length;
          this.activeProjects = this.projects.filter(p => p.status === 'ACTIVE').length;

          // Define pool of available employees from system users or fallback list
          const availableEmps = this.allSystemUsers.length > 0 
            ? this.allSystemUsers.filter(u => (u.role || '').toUpperCase().includes('EMPLOYEE')).map(u => u.name)
            : ['John Developer', 'Alice Designer', 'Bob QA', 'Charlie DevOps', 'Diana Frontend'];

          const employeePool = availableEmps.length > 0 ? availableEmps : ['John Developer', 'Alice Designer'];

          // Map every project to a team card, assigning unique rotating employees based on index
          this.allocatedTeamsList = this.projects.map((p, idx) => {
            const emp1 = employeePool[idx % employeePool.length];
            const emp2 = employeePool[(idx + 1) % employeePool.length];
            const assignedEmps = emp1 === emp2 ? [emp1] : [emp1, emp2];

            return {
              id: p.id || idx,
              projectName: p.name,
              managerName: p.managerName || 'Assigned Project Manager',
              employees: assignedEmps
            };
          });

          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.totalProjects = 0;
        this.activeProjects = 0;
      }
    });

    this.taskService.getTasks().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const tasks = res.data;
          const today = new Date().toISOString().split('T')[0];
          this.totalTasksCount = tasks.length;
          this.completedTasksCount = tasks.filter((t: any) => t.status === 'COMPLETED').length;
          this.overdueTasksCount = tasks.filter((t: any) => t.dueDate < today && t.status !== 'COMPLETED').length;
          this.cdr.detectChanges();
        }
      }
    });

    this.userService.getManagers().subscribe(res => {
      if (res.success) this.managers = res.data;
    });

    // 2. Fetch all system users reliably from database for User Security & Details module
    const userObservable = typeof (this.userService as any).getUsers === 'function' 
      ? (this.userService as any).getUsers() 
      : this.userService.getPendingUsers();

    userObservable.subscribe({
      next: (res: any) => {
        const rawUsers = res?.data ? res.data : (Array.isArray(res) ? res : []);
        if (rawUsers.length > 0) {
          this.allSystemUsers = rawUsers.map((u: any) => ({
            id: u.id,
            name: u.name || 'Unknown User',
            email: u.email || 'N/A',
            role: u.role || 'ROLE_EMPLOYEE',
            isBlocked: u.isBlocked || !u.active || false,
            blockReason: u.blockReason || (u.status === 'REJECTED' ? 'Administrative Rejection' : '')
          }));
        } else {
          this.loadMockSystemUsers();
        }
        this.employeesList = this.allSystemUsers.filter((u: any) => (u.role || '').toUpperCase().includes('EMPLOYEE'));
        this.applyUserManagementFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadMockSystemUsers();
      }
    });

    this.userService.getPendingUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingUsers = res.data;
          this.applyUserFilters();
          this.pendingRequests = this.pendingUsers.length;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pendingRequests = 0;
      }
    });

    this.loadAuditLogs();
  }

  loadMockSystemUsers(): void {
    this.allSystemUsers = [
      { id: '1', name: 'John Developer', email: 'emp1@company.com', role: 'ROLE_EMPLOYEE', isBlocked: false, blockReason: '' },
      { id: '2', name: 'Alice Designer', email: 'emp2@company.com', role: 'ROLE_EMPLOYEE', isBlocked: false, blockReason: '' },
      { id: '3', name: 'Sarah Manager', email: 'pm1@company.com', role: 'ROLE_PROJECT_MANAGER', isBlocked: false, blockReason: '' },
      { id: '4', name: 'David Manager', email: 'pm2@company.com', role: 'ROLE_PROJECT_MANAGER', isBlocked: false, blockReason: '' },
      { id: '5', name: 'Blocked Tester', email: 'test.blocked@company.com', role: 'ROLE_EMPLOYEE', isBlocked: true, blockReason: 'Suspicious Login Activity' }
    ];
    this.employeesList = this.allSystemUsers.filter(u => u.role.includes('EMPLOYEE'));
    this.applyUserManagementFilters();
  }

  // Project Team Allocation Form Handlers
  openTeamAllocationModal(allocation?: any): void {
    if (allocation) {
      this.isEditingAllocation = true;
      this.editingAllocationId = allocation.id;
      this.newAllocationForm = {
        projectId: allocation.id,
        projectName: allocation.projectName,
        managerId: allocation.managerName,
        managerName: allocation.managerName,
        employeeId: ''
      };
      this.selectedTeamEmployeesCart = [...allocation.employees];
    } else {
      this.isEditingAllocation = false;
      this.editingAllocationId = null;
      this.newAllocationForm = { projectId: '', projectName: '', managerId: '', managerName: '', employeeId: '' };
      this.selectedTeamEmployeesCart = [];
    }
    this.showTeamAllocationModal = true;
  }

  closeTeamAllocationModal(): void {
    this.showTeamAllocationModal = false;
  }

  addEmployeeToCart(): void {
    if (this.newAllocationForm.employeeId) {
      const empName = this.newAllocationForm.employeeId;
      if (!this.selectedTeamEmployeesCart.includes(empName)) {
        this.selectedTeamEmployeesCart.push(empName);
      }
      this.newAllocationForm.employeeId = '';
    }
  }

  removeEmployeeFromCart(emp: string): void {
    this.selectedTeamEmployeesCart = this.selectedTeamEmployeesCart.filter(e => e !== emp);
  }

  saveTeamAllocationForm(): void {
    if (!this.newAllocationForm.projectName || !this.newAllocationForm.managerId) {
      alert('Please provide a project name and select a Project Manager.');
      return;
    }

    if (this.isEditingAllocation && this.editingAllocationId !== null) {
      const index = this.allocatedTeamsList.findIndex(t => t.id === this.editingAllocationId);
      if (index !== -1) {
        this.allocatedTeamsList[index] = {
          ...this.allocatedTeamsList[index],
          projectName: this.newAllocationForm.projectName,
          managerName: this.newAllocationForm.managerId,
          employees: [...this.selectedTeamEmployeesCart]
        };
      }
      alert('Team allocation updated successfully!');
    } else {
      const newEntry = {
        id: 'alloc_' + Date.now(),
        projectName: this.newAllocationForm.projectName,
        managerName: this.newAllocationForm.managerId,
        employees: [...this.selectedTeamEmployeesCart]
      };
      this.allocatedTeamsList.push(newEntry);
      alert('New project team successfully allocated!');
    }
    this.closeTeamAllocationModal();
  }

  deleteAllocatedTeam(id: any): void {
    if (confirm('Are you sure you want to delete this team allocation?')) {
      this.allocatedTeamsList = this.allocatedTeamsList.filter(t => t.id !== id);
    }
  }

  // User Management Filters (Excluding Admin and supporting Role Filter Dropdown)
  applyUserManagementFilters(): void {
    const q = this.userManagementSearchQuery.toLowerCase();
    
    // Exclude Admin users from the list
    const nonAdminUsers = this.allSystemUsers.filter(u => {
      const roleStr = (u.role || '').toUpperCase();
      const nameStr = (u.name || '').toUpperCase();
      return !roleStr.includes('ADMIN') && !nameStr.includes('ADMIN');
    });

    this.filteredSystemUsers = nonAdminUsers.filter(u => {
      const matchSearch = (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
      
      let matchType = true;
      if (this.selectedUserStatusFilter === 'Active Only') {
        matchType = !u.isBlocked;
      } else if (this.selectedUserStatusFilter === 'Blocked Only') {
        matchType = u.isBlocked;
      }

      let matchRole = true;
      if (this.selectedUserRoleFilter !== 'ALL') {
        matchRole = (u.role || '').toUpperCase().includes(this.selectedUserRoleFilter.toUpperCase());
      }

      return matchSearch && matchType && matchRole;
    });
  }

  setSystemUserFilter(filterType: string): void {
    this.selectedUserStatusFilter = filterType;
    this.applyUserManagementFilters();
  }

  openBlockUserModal(user: any): void {
    this.selectedUserToBlock = user;
    this.selectedBlockReason = 'Security Policy Violation';
    this.showBlockUserModal = true;
  }

  closeBlockUserModal(): void {
    this.showBlockUserModal = false;
    this.selectedUserToBlock = null;
  }

  confirmBlockUser(): void {
    if (this.selectedUserToBlock && this.selectedUserToBlock.id) {
      this.userService.blockUser(this.selectedUserToBlock.id, this.selectedBlockReason).subscribe({
        next: () => {
          alert(`User ${this.selectedUserToBlock.name} has been blocked successfully.`);
          this.closeBlockUserModal();
          this.loadDashboardData();
        },
        error: (err) => alert(err.error?.message || 'Failed to block user.')
      });
    }
  }

  unblockUser(user: any): void {
    if (user && user.id) {
      this.userService.unblockUser(user.id).subscribe({
        next: () => {
          alert(`User ${user.name} has been unblocked. Their access is fully restored.`);
          this.loadDashboardData();
        },
        error: (err) => alert(err.error?.message || 'Failed to unblock user.')
      });
    }
  }

  loadAuditLogs(): void {
    this.auditLogService.getAuditLogs().subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          const rawLogs = res?.data ? res.data : (Array.isArray(res) ? res : []);
          this.auditLogs = rawLogs.map((log: any) => ({
            id: log.id,
            action: log.action || 'N/A',
            details: log.details || '',
            performedBy: log.performedBy || log.performed_by || 'UNKNOWN_USER',
            timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
          }));
          this.applyAuditFilters();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error fetching audit logs:', err)
    });
  }

  openProjectDetailsModal(project: any, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedProjectForDetails = project;
    this.showProjectDetailsModal = true;
    
    this.taskService.getTasks().subscribe((res: any) => {
      const allTasks: Task[] = res?.data ? res.data : (Array.isArray(res) ? res : []);
      this.projectAssociatedTasks = allTasks.filter(t => {
        const tProjId = String((t as any).projectId || (t as any).project_id || '').trim();
        const pId = String(project.id || '').trim();
        const tProjName = String((t as any).projectName || '').toLowerCase().trim();
        const pName = String(project.name || '').toLowerCase().trim();
        return (tProjId && pId && tProjId === pId) || (tProjName && pName && tProjName === pName);
      });
      this.cdr.detectChanges();
    });
  }

  closeProjectDetailsModal(): void {
    this.showProjectDetailsModal = false;
    this.selectedProjectForDetails = null;
    this.projectAssociatedTasks = [];
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

  applyProjectFilters(): void {
    const q = this.projectSearchQuery.toLowerCase();
    this.filteredProjects = this.projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      const matchMgr = this.selectedManagerFilter === 'ALL' || p.managerId === this.selectedManagerFilter;
      const matchStatus = this.selectedStatusFilter === 'ALL' || p.status === this.selectedStatusFilter;
      return matchSearch && matchMgr && matchStatus;
    });
  }

  applyUserFilters(): void {
    const q = this.userSearchQuery.toLowerCase();
    this.filteredPendingUsers = this.pendingUsers.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = this.selectedRoleFilter === 'ALL' || u.role === this.selectedRoleFilter;
      return matchSearch && matchRole;
    });
  }

  applyAuditFilters(): void {
    const q = this.auditSearchQuery.toLowerCase();
    this.filteredAuditLogs = this.auditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const matchSearch = (log.details && log.details.toLowerCase().includes(q)) || 
                          (log.performedBy && log.performedBy.toLowerCase().includes(q)) ||
                          (log.action && log.action.toLowerCase().includes(q));
      const matchAction = this.selectedActionFilter === 'ALL' || log.action === this.selectedActionFilter;
      const matchYear = this.selectedAuditYear === 'ALL' || logDate.getFullYear().toString() === this.selectedAuditYear;
      const matchMonth = this.selectedAuditMonth === 'ALL' || logDate.getMonth().toString() === this.selectedAuditMonth;
      return matchSearch && matchAction && matchYear && matchMonth;
    });
  }

  openAuditExportModal(format: 'EXCEL' | 'PDF'): void {
    this.auditExportFormat = format;
    this.exportFromDate = '';
    this.exportToDate = '';
    this.showAuditExportModal = true;
  }

  closeAuditExportModal(): void {
    this.showAuditExportModal = false;
  }

  confirmAuditExport(): void {
    let logsToExport = this.auditLogs;
    if (this.exportFromDate || this.exportToDate) {
      logsToExport = logsToExport.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        let valid = true;
        if (this.exportFromDate) valid = valid && logTime >= new Date(this.exportFromDate).getTime();
        if (this.exportToDate) {
          const endDate = new Date(this.exportToDate);
          endDate.setHours(23, 59, 59, 999);
          valid = valid && logTime <= endDate.getTime();
        }
        return valid;
      });
    }

    if (this.auditExportFormat === 'EXCEL') {
      const formattedData = logsToExport.map(log => ({
        Action: log.action,
        PerformedBy: log.performedBy,
        Details: log.details,
        Timestamp: new Date(log.timestamp).toLocaleString()
      }));
      this.exportService.exportToExcel(formattedData, 'Audit_Logs_Report');
    } else {
      const headers = ['Action', 'Performed By', 'Details', 'Timestamp'];
      const rows = logsToExport.map(log => [
        log.action,
        log.performedBy,
        log.details,
        new Date(log.timestamp).toLocaleString()
      ]);
      this.exportService.exportToPDF(headers, rows, 'Audit_Logs_Report', 'System Audit Trail Report');
    }
    this.closeAuditExportModal();
  }

  exportProjectsExcel(): void {
    this.exportService.exportToExcel(this.filteredProjects, 'Projects_Report');
  }

  exportProjectsPDF(): void {
    const headers = ['Project Name', 'Manager', 'Status', 'Progress'];
    const rows = this.filteredProjects.map(p => [p.name, p.managerName || 'Unassigned', p.status, `${p.progress}%`]);
    this.exportService.exportToPDF(headers, rows, 'Projects_Report', 'System Projects Summary');
  }

  downloadSampleTemplate(): void {
    this.exportService.downloadSampleExcelTemplate(this.managers);
  }

 // Bulk Excel Upload Methods
  openBulkUploadModal(): void {
    this.parsedBulkRows = [];
    this.bulkValidationErrors = [];
    this.showBulkUploadModal = true;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const buffer = e.target.result;
      const workbook = XLSX.read(buffer, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
      this.validateAndParseExcel(jsonData);
    };
    reader.readAsBinaryString(file);
  }

  validateAndParseExcel(rows: any[]): void {
    this.parsedBulkRows = [];
    this.bulkValidationErrors = [];
    const requiredColumns = ['ProjectName', 'Description', 'Status', 'ManagerEmail'];

    if (rows.length === 0) {
      this.bulkValidationErrors.push('Uploaded Excel sheet is empty!');
      return;
    }

    const firstRowKeys = Object.keys(rows[0]);
    const missingCols = requiredColumns.filter(col => !firstRowKeys.includes(col));
    if (missingCols.length > 0) {
      this.bulkValidationErrors.push(`Column Mismatch Error: Missing required headers (${missingCols.join(', ')})`);
      return;
    }

    rows.forEach((row) => {
      let isValid = true;
      let reason = 'Approved';
      if (!row.ProjectName) {
        isValid = false;
        reason = 'Missing ProjectName';
      } else if (!row.ManagerEmail) {
        isValid = false;
        reason = 'Missing ManagerEmail';
      }

      const matchedManager = this.managers.find(m => m.email === row.ManagerEmail);
      if (isValid && !matchedManager) {
        isValid = false;
        reason = `Manager email '${row.ManagerEmail}' not found in database`;
      }

      this.parsedBulkRows.push({
        name: row.ProjectName,
        description: row.Description,
        startDate: row.StartDate || new Date().toISOString().split('T')[0],
        endDate: row.EndDate || '',
        status: row.Status || 'PLANNED',
        managerId: matchedManager ? matchedManager.id : null,
        managerName: matchedManager ? matchedManager.name : 'Unknown',
        isValid,
        reason
      });
    });
  }

  confirmBulkImport(): void {
    const validRows = this.parsedBulkRows.filter(r => r.isValid);
    validRows.forEach(row => {
      this.projectService.createProject(row).subscribe(() => this.loadDashboardData());
    });
    this.showBulkUploadModal = false;
    alert('Bulk project import successful!');
  }

  openCreateModal(project?: any): void { 
    if (project) {
      this.newProject = { ...project }; 
    } else {
      this.newProject = {
        name: '', description: '', startDate: new Date().toISOString().split('T')[0],
        endDate: '', status: 'PLANNED', managerId: ''
      };
    }
    this.showCreateModal = true; 
  }

  closeCreateModal(): void { 
    this.showCreateModal = false; 
  }

  saveProject(): void {
    if (this.newProject.id) {
      this.projectService.updateProject(this.newProject.id, this.newProject).subscribe(() => {
        this.loadDashboardData();
        this.closeCreateModal();
      });
    } else {
      this.projectService.createProject(this.newProject).subscribe(() => {
        this.loadDashboardData();
        this.closeCreateModal();
      });
    }
  }

  openReassignModal(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.selectedProjectToReassign = project;
    this.newSelectedManagerId = project.managerId || '';
    this.selectedReasonPreset = 'Workload Balancing';
    this.customReasonText = '';
    this.showReassignModal = true;
  }

  closeReassignModal(): void {
    this.showReassignModal = false;
    this.selectedProjectToReassign = null;
  }

  confirmReassignment(): void {
    if (this.selectedProjectToReassign && this.selectedProjectToReassign.id && this.newSelectedManagerId) {
      const formattedStartDate = this.selectedProjectToReassign.startDate 
        ? new Date(this.selectedProjectToReassign.startDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      const formattedEndDate = this.selectedProjectToReassign.endDate 
        ? new Date(this.selectedProjectToReassign.endDate).toISOString().split('T')[0] 
        : '';

      const requestPayload = {
        name: this.selectedProjectToReassign.name,
        description: this.selectedProjectToReassign.description || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: this.selectedProjectToReassign.status,
        managerId: this.newSelectedManagerId
      };

      this.projectService.updateProject(this.selectedProjectToReassign.id, requestPayload).subscribe({
        next: () => {
          this.loadDashboardData();
          this.closeReassignModal();
        },
        error: (err) => console.error('Error reassigning project manager:', err)
      });
    }
  }

  openExtendModal(project: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedProjectToExtend = project;
    this.newStartDate = project.startDate ? String(project.startDate) : new Date().toISOString().split('T')[0];
    this.newEndDate = project.endDate ? String(project.endDate) : '';
    this.showExtendDurationModal = true;
  }

  closeExtendModal(): void {
    this.showExtendDurationModal = false;
    this.selectedProjectToExtend = null;
  }

  confirmDurationUpdate(): void {
    if (this.selectedProjectToExtend && this.selectedProjectToExtend.id) {
      this.projectService.updateProject(this.selectedProjectToExtend.id, {
        name: this.selectedProjectToExtend.name,
        description: this.selectedProjectToExtend.description || '',
        startDate: this.newStartDate as any,
        endDate: this.newEndDate as any,
        status: this.selectedProjectToExtend.status,
        managerId: this.selectedProjectToExtend.managerId
      }).subscribe(() => {
        this.loadDashboardData();
        this.closeExtendModal();
      });
    }
  }

  approveUser(userId: string): void {
    this.userService.approveUser(userId).subscribe(() => this.loadDashboardData());
  }

  deleteProject(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.projectService.deleteProject(id).subscribe(() => this.loadDashboardData());
  }
}