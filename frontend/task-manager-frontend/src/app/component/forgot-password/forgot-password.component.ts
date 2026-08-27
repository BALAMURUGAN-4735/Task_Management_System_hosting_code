import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatCardModule,
    MatInputModule, MatButtonModule, MatFormFieldModule, MatIconModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  hideNewPassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  toggleNewPassword(): void {
    this.hideNewPassword = !this.hideNewPassword;
  }

  toggleConfirmPassword(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  onResetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotForm.value.newPassword !== this.forgotForm.value.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    if (this.forgotForm.valid) {
      this.authService.resetPassword(this.forgotForm.value.email, this.forgotForm.value.newPassword).subscribe({
        next: () => {
          this.successMessage = 'Password reset successfully! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update password. Verify your email.';
        }
      });
    }
  }
}