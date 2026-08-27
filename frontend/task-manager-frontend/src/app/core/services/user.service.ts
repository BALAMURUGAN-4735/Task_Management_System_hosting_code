import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/auth.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getManagers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/managers`);
  }

  getEmployees(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/employees`);
  }

  getPendingUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/pending`);
  }

  approveUser(userId: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/${userId}/approve`, {});
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(this.apiUrl); // Fixed: Calls http://localhost:8080/api/users correctly
  }

  uploadAvatar(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post(`http://localhost:8080/api/users/avatar`, formData);
}

blockUser(userId: string, reason: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/${userId}/block`, { reason });
}

unblockUser(userId: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/${userId}/unblock`, {});
}
}