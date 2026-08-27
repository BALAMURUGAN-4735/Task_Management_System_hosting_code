import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { RegisterComponent } from './component/register/register.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './component/manager-dashboard/manager-dashboard.component';
import { EmployeeDashboardComponent } from './component/employee-dashboard/employee-dashboard.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  
  // Aliases / Redirects for backward compatibility
  { path: 'admin', redirectTo: 'api/dashboard/admin', pathMatch: 'full' },
  { path: 'manager', redirectTo: 'api/dashboard/project-manager', pathMatch: 'full' },
  { path: 'employee', redirectTo: 'api/dashboard/employee', pathMatch: 'full' },

  { 
    path: 'api/dashboard/admin', 
    component: AdminDashboardComponent, 
    canActivate: [roleGuard(['ROLE_ADMIN'])] 
  },
  { 
    path: 'api/dashboard/project-manager', 
    component: ManagerDashboardComponent, 
    canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_PROJECT_MANAGER'])] 
  },
  { 
    path: 'api/dashboard/employee', 
    component: EmployeeDashboardComponent, 
    canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_EMPLOYEE'])] 
  },
  { path: '**', redirectTo: 'login' }
];