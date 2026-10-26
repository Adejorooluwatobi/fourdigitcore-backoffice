import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemAdminDetailDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  roles: string[];
  lastLoginAt?: string;
  createdAt: string;
}

export interface InviteAdminDto {
  email: string;
  fullName: string;
  assignedRole: string; // 'SUPERADMIN', 'SYSTEMS_FELLOW', 'CONTENT_OPERATOR', 'Admin'
}

export interface AdminInvitationDto {
  id: string;
  email: string;
  fullName: string;
  assignedRole: string;
  expiresAt: string;
  isAccepted: boolean;
  acceptedAt?: string;
  isRevoked: boolean;
  isExpired: boolean;
  invitedByAdminName: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/users`;

  admins = signal<SystemAdminDetailDto[]>([]);
  invitations = signal<AdminInvitationDto[]>([]);
  loading = signal<boolean>(false);

  loadAdmins(): Observable<SystemAdminDetailDto[]> {
    this.loading.set(true);
    return this.http.get<SystemAdminDetailDto[]>(this.apiUrl).pipe(
      tap({
        next: (res) => {
          this.admins.set(res || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  loadInvitations(): Observable<AdminInvitationDto[]> {
    return this.http.get<AdminInvitationDto[]>(`${this.apiUrl}/invitations`).pipe(
      tap((res) => this.invitations.set(res || []))
    );
  }

  inviteAdmin(dto: InviteAdminDto): Observable<AdminInvitationDto> {
    return this.http.post<AdminInvitationDto>(`${this.apiUrl}/invite`, dto).pipe(
      tap(() => this.loadInvitations().subscribe())
    );
  }

  resendInvitation(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/invitations/${id}/resend`, {}).pipe(
      tap(() => this.loadInvitations().subscribe())
    );
  }

  revokeInvitation(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/invitations/${id}`).pipe(
      tap(() => this.loadInvitations().subscribe())
    );
  }

  suspendAdmin(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/suspend`, {}).pipe(
      tap(() => this.loadAdmins().subscribe())
    );
  }

  reactivateAdmin(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/reactivate`, {}).pipe(
      tap(() => this.loadAdmins().subscribe())
    );
  }

  deleteAdmin(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadAdmins().subscribe())
    );
  }
}
