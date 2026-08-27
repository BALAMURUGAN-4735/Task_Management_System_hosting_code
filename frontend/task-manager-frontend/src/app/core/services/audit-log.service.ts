import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  id?: string;
  action: string;
  details: string;
  performedBy?: string;
  performed_by?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = `${environment.apiUrl}/api/audit-logs`; // Adjust to your backend URL

  constructor(private http: HttpClient) {}

  getAuditLogs(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}