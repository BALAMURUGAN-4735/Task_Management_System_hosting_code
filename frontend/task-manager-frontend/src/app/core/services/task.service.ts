import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/auth.model';
import { Task, Comment } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = `${environment.apiUrl}/api/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<ApiResponse<Task[]>> {
    return this.http.get<ApiResponse<Task[]>>(this.apiUrl);
  }

  createTask(task: Partial<Task>): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<ApiResponse<Task>> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  addComment(taskId: string, message: string): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(`${this.apiUrl}/comments`, { taskId, message });
  }

  getComments(taskId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/${taskId}/comments`);
  }
  getProjects(page: number = 0, size: number = 10): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(`${this.apiUrl}?page=${page}&size=${size}`);
}

}