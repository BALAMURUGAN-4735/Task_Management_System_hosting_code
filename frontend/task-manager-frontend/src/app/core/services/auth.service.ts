import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, interval } from 'rxjs';
import { ApiResponse, AuthResponse, AuthRequest, RegisterRequest } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkTokenExpirationInterval();
  }

  private getUserFromStorage(): any {
    const userJson = sessionStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  login(credentials: AuthRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.handleAuthenticationSuccess(res.data);
        }
      })
    );
  }

  handleAuthenticationSuccess(data: AuthResponse): void {
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('role', data.role);
    sessionStorage.setItem('user', JSON.stringify(data));
    if (data.id) {
      localStorage.setItem('userId', data.id);
    }
    this.currentUserSubject.next(data);
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, data);
  }

  resetPassword(email: string, newPassword: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/forgot-password`, { email, newPassword });
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getRole(): string | null {
    return sessionStorage.getItem('role');
  }

  getUserRole(): string | null {
    return this.getRole();
  }

  getUserName(): string {
    const user = this.currentUserSubject.value || this.getUserFromStorage();
    return user ? user.name : 'User';
  }

  getUserId(): string {
    const userId = localStorage.getItem('userId');
    if (userId) return userId;

    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user).id || '';
      } catch (e) {}
    }
    return '';
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch (e) {
      return true;
    }
  }

  private checkTokenExpirationInterval(): void {
    interval(30000).subscribe(() => {
      const token = this.getToken();
      if (token && this.isTokenExpired(token)) {
        console.warn('Session expired. Forcing automatic logout.');
        this.logout();
        window.location.href = '/login';
      }
    });
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('user');
    localStorage.removeItem('userId');
    this.currentUserSubject.next(null);
  }
}