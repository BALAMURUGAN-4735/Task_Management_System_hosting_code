import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getUserRole();
  const requiredRole = route.data?.['role'];

  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'ROLE_ADMIN') router.navigate(['/admin']);
    else if (userRole === 'ROLE_PROJECT_MANAGER') router.navigate(['/manager']);
    else if (userRole === 'ROLE_EMPLOYEE') router.navigate(['/employee']);
    else router.navigate(['/login']);
    return false;
  }

  return true;
};