import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, 
    MatInputModule, MatButtonModule, MatFormFieldModule,
    MatIconModule, MatTabsModule, MatSelectModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotForm: FormGroup;

  hideLoginPassword = true;
  hideRegPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['ROLE_EMPLOYEE', Validators.required]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const role = params['role'];
      const name = params['name'];
      const id = params['id'];

      if (token) {
        this.authService.handleAuthenticationSuccess({
          token,
          role: role || 'ROLE_EMPLOYEE',
          name: name || 'Google User',
          id: id || '',
          email: ''
        });

        if (role === 'ROLE_ADMIN') this.router.navigate(['/admin']);
        else if (role === 'ROLE_PROJECT_MANAGER') this.router.navigate(['/manager']);
        else this.router.navigate(['/employee']);
      }
    });
  }

  onLogin(): void {
    this.clearAlerts();
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            const role = res.data.role;
            if (role === 'ROLE_ADMIN') this.router.navigate(['/admin']);
            else if (role === 'ROLE_PROJECT_MANAGER') this.router.navigate(['/manager']);
            else if (role === 'ROLE_EMPLOYEE') this.router.navigate(['/employee']);
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Invalid email or password!';
        }
      });
    }
  }

  onRegister(): void {
    this.clearAlerts();
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.successMessage = 'Registration submitted! Account is under admin verification.';
          this.registerForm.reset({ role: 'ROLE_EMPLOYEE' });
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Registration failed.';
        }
      });
    }
  }

  onForgotPassword(): void {
    this.clearAlerts();
    if (this.forgotForm.value.newPassword !== this.forgotForm.value.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    if (this.forgotForm.valid) {
      this.authService.resetPassword(this.forgotForm.value.email, this.forgotForm.value.newPassword).subscribe({
        next: () => {
          this.successMessage = 'Password updated successfully! You can now log in.';
          this.forgotForm.reset();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update password.';
        }
      });
    }
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  // Changed to public so it can be called from the HTML template's (selectedTabChange) event
  public clearAlerts(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}