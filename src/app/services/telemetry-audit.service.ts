import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditLogUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: AuditLogUser;
  action: string; // CREATE, UPDATE, DELETE, STAGE_CHANGE, LOGIN
  entityType: string;
  entityId?: string;
  diffPayload?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface TelemetrySnapshot {
  id: string;
  latencyMs: number;
  tpsThroughput: number;
  jitterVariancePct: number;
  convergenceState: string;
  recordedAt: string;
}

export interface TelemetryNode {
  id: string;
  nodeIdentifier: string;
  region: string;
  enclaveType: string;
  status: string; // Online, Degraded, Maintenance, Offline
  snapshots?: TelemetrySnapshot[];
  updatedAt?: string;
}

export interface MaintenanceAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: string; // Info, Warning, Critical
  isActive: boolean;
  startsAt: string;
  endsAt?: string;
  createdAt: string;
}

export interface UpsertAnnouncementDto {
  title: string;
  message: string;
  severity: string;
  isActive: boolean;
  startsAt: string;
  endsAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryAuditService {
  private http = inject(HttpClient);
  private auditUrl = `${environment.apiUrl}/admin/audit-logs`;
  private telemetryUrl = `${environment.apiUrl}/admin/telemetry`;

  logs = signal<AuditLog[]>([]);
  nodes = signal<TelemetryNode[]>([]);
  announcements = signal<MaintenanceAnnouncement[]>([]);
  loading = signal<boolean>(false);

  loadAuditLogs(page: number = 1, pageSize: number = 50): Observable<AuditLog[]> {
    this.loading.set(true);
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<AuditLog[]>(this.auditUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.logs.set(res || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  loadNodes(): Observable<TelemetryNode[]> {
    return this.http.get<TelemetryNode[]>(`${this.telemetryUrl}/nodes`).pipe(
      tap((res) => this.nodes.set(res || []))
    );
  }

  updateNodeStatus(id: string, status: string): Observable<{ message: string }> {
    const params = new HttpParams().set('status', status);
    return this.http.put<{ message: string }>(`${this.telemetryUrl}/nodes/${id}/status`, {}, { params }).pipe(
      tap(() => this.loadNodes().subscribe())
    );
  }

  loadAnnouncements(): Observable<MaintenanceAnnouncement[]> {
    return this.http.get<MaintenanceAnnouncement[]>(`${this.telemetryUrl}/announcements`).pipe(
      tap((res) => this.announcements.set(res || []))
    );
  }

  createAnnouncement(dto: UpsertAnnouncementDto): Observable<MaintenanceAnnouncement> {
    return this.http.post<MaintenanceAnnouncement>(`${this.telemetryUrl}/announcements`, dto).pipe(
      tap(() => this.loadAnnouncements().subscribe())
    );
  }

  updateAnnouncement(id: string, dto: UpsertAnnouncementDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.telemetryUrl}/announcements/${id}`, dto).pipe(
      tap(() => this.loadAnnouncements().subscribe())
    );
  }

  deleteAnnouncement(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.telemetryUrl}/announcements/${id}`).pipe(
      tap(() => this.loadAnnouncements().subscribe())
    );
  }
}
