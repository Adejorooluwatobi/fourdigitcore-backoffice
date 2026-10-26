import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AcademyCohort {
  id: string;
  trackId: string;
  name: string;
  applicationDeadline: string;
  startDate: string;
  endDate: string;
  maxSeats: number;
  status: string;
  createdAt: string;
}

export interface StudentApplication {
  id: string;
  cohortId?: string;
  cohortName?: string;
  studentName: string;
  email: string;
  backgroundSummary?: string;
  githubProfileUrl?: string;
  status: string;
  appliedAt: string;
}

export interface CertificateItem {
  id: string;
  certCode: string;
  recipientName: string;
  trackName: string;
  sha256Hash: string;
  verificationUrl: string;
  issuedAt: string;
}

export interface UpsertCohortDto {
  trackId: string;
  name: string;
  applicationDeadline: string;
  startDate: string;
  endDate: string;
  maxSeats: number;
  status: string;
}

export interface IssueCertDto {
  enrollmentId: string;
  recipientName: string;
  trackName: string;
  signedByAdminName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademyService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/v1/admin/academy`;
  private publicUrl = `${environment.apiUrl}/v1/academy`;

  public getPublicAcademy(): Observable<any> {
    return this.http.get<any>(this.publicUrl);
  }

  public getCohorts(): Observable<any> {
    return this.http.get<any>(this.publicUrl);
  }

  public createCohort(dto: UpsertCohortDto): Observable<AcademyCohort> {
    return this.http.post<AcademyCohort>(`${this.adminUrl}/cohorts`, dto);
  }

  public updateCohort(id: string, dto: UpsertCohortDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.adminUrl}/cohorts/${id}`, dto);
  }

  public deleteCohort(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminUrl}/cohorts/${id}`);
  }

  public getStudentApplications(): Observable<StudentApplication[]> {
    return this.http.get<StudentApplication[]>(`${this.adminUrl}/applications`);
  }

  public updateAppStatus(id: string, status: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.adminUrl}/applications/${id}/status`, { status });
  }

  public getCertificates(): Observable<CertificateItem[]> {
    return this.http.get<CertificateItem[]>(`${this.adminUrl}/certificates`);
  }

  public issueCertificate(dto: IssueCertDto): Observable<any> {
    return this.http.post<any>(`${this.adminUrl}/certificates/issue`, dto);
  }
}
