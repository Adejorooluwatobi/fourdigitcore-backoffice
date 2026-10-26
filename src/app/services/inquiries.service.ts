import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InquiryNote {
  id: string;
  inquiryId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  organization?: string;
  scaleCategory: string; // e.g. "Cluster", "Enclave", "Enterprise"
  intent: string;
  scopeConstraints: string;
  status: string; // New, InProgress, Resolved, Archived
  priority: string; // Low, Normal, High, Urgent
  assignedAdminName?: string;
  clientIpHash?: string;
  createdAt: string;
  updatedAt?: string;
  notes: InquiryNote[];
}

export interface UpdateInquiryStatusDto {
  status: string;
  priority?: string;
  assignedAdminName?: string;
}

export interface AddInquiryNoteDto {
  content: string;
  authorName: string;
}

export interface InquiryStats {
  totalCount: number;
  unreadCount: number;
  todayCount: number;
  archivedCount: number;
}

export interface ContactPageSettings {
  id?: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  intentLabel: string;
  feedbackSuccessText: string;
  updatedAt?: string;
}

export interface InquiryIntentOption {
  id: string;
  intentKey: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface InquiryScaleOption {
  id: string;
  scaleKey: string;
  displayText: string;
  sortOrder: number;
  isActive: boolean;
}

export interface BriefingFormConfig {
  settings: ContactPageSettings;
  intentOptions: InquiryIntentOption[];
  scaleOptions: InquiryScaleOption[];
}

export interface UpdateContactPageSettingsDto {
  badgeText: string;
  headline: string;
  subheadline: string;
  intentLabel: string;
  feedbackSuccessText: string;
}

export interface UpsertInquiryIntentOptionDto {
  intentKey: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UpsertInquiryScaleOptionDto {
  scaleKey: string;
  displayText: string;
  sortOrder: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InquiriesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/inquiries`;

  inquiries = signal<ContactInquiry[]>([]);
  selectedInquiry = signal<ContactInquiry | null>(null);
  loading = signal<boolean>(false);

  loadInquiries(status?: string, page: number = 1, pageSize: number = 50): Observable<ContactInquiry[]> {
    this.loading.set(true);
    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<ContactInquiry[]>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.inquiries.set(res || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  getInquiryById(id: string): Observable<ContactInquiry> {
    return this.http.get<ContactInquiry>(`${this.apiUrl}/${id}`).pipe(
      tap((item) => this.selectedInquiry.set(item))
    );
  }

  updateStatus(id: string, dto: UpdateInquiryStatusDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/status`, dto).pipe(
      tap(() => {
        this.loadInquiries().subscribe();
        if (this.selectedInquiry()?.id === id) {
          this.getInquiryById(id).subscribe();
        }
      })
    );
  }

  addNote(id: string, dto: AddInquiryNoteDto): Observable<InquiryNote> {
    return this.http.post<InquiryNote>(`${this.apiUrl}/${id}/notes`, dto).pipe(
      tap(() => {
        if (this.selectedInquiry()?.id === id) {
          this.getInquiryById(id).subscribe();
        }
      })
    );
  }

  deleteInquiry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadInquiries().subscribe())
    );
  }

  // --- Contact Briefing Form Configuration ---

  getBriefingFormConfig(): Observable<BriefingFormConfig> {
    return this.http.get<BriefingFormConfig>(`${this.apiUrl}/config`);
  }

  updateBriefingSettings(dto: UpdateContactPageSettingsDto): Observable<{ message: string; settings: ContactPageSettings }> {
    return this.http.put<{ message: string; settings: ContactPageSettings }>(`${this.apiUrl}/config/settings`, dto);
  }

  createIntentOption(dto: UpsertInquiryIntentOptionDto): Observable<InquiryIntentOption> {
    return this.http.post<InquiryIntentOption>(`${this.apiUrl}/config/intents`, dto);
  }

  updateIntentOption(id: string, dto: UpsertInquiryIntentOptionDto): Observable<InquiryIntentOption> {
    return this.http.put<InquiryIntentOption>(`${this.apiUrl}/config/intents/${id}`, dto);
  }

  deleteIntentOption(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/config/intents/${id}`);
  }

  createScaleOption(dto: UpsertInquiryScaleOptionDto): Observable<InquiryScaleOption> {
    return this.http.post<InquiryScaleOption>(`${this.apiUrl}/config/scales`, dto);
  }

  updateScaleOption(id: string, dto: UpsertInquiryScaleOptionDto): Observable<InquiryScaleOption> {
    return this.http.put<InquiryScaleOption>(`${this.apiUrl}/config/scales/${id}`, dto);
  }

  deleteScaleOption(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/config/scales/${id}`);
  }
}
