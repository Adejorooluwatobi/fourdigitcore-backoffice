import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JobDepartment {
  id: string;
  name: string;
  displayOrder: number;
}

export interface JobPosting {
  id: string;
  departmentId: string;
  department?: JobDepartment;
  title: string;
  slug: string;
  locationType: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requirements: string;
  techStackTags: string; // JSON string e.g. "[\"Rust\", \"eBPF\"]"
  status: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertJobPostingDto {
  departmentId: string;
  title: string;
  slug: string;
  locationType: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requirements: string;
  techStackTags: string;
  status: string;
  sortOrder: number;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  location?: string;
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  authorName: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export interface ApplicationInterview {
  id: string;
  applicationId: string;
  interviewerName: string;
  stageName: string;
  scheduledAt: string;
  meetingLink?: string;
  feedbackSummary?: string;
  outcome: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job?: JobPosting;
  candidateId: string;
  candidate?: Candidate;
  resumeFileUrl: string;
  coverLetter?: string;
  status: string; // Applied, Screening, TechnicalInterview, ArchitectureReview, OfferExtended, Hired, Rejected
  rating: number;
  rejectionReason?: string;
  appliedAt: string;
  notes: ApplicationNote[];
  interviews: ApplicationInterview[];
}

export interface UpdateApplicationStageDto {
  stage: string;
  rating?: number;
  rejectionReason?: string;
}

export interface AddApplicationNoteDto {
  content: string;
  authorName: string;
  rating?: number;
}

export interface ScheduleInterviewDto {
  interviewerName: string;
  stageName: string;
  scheduledAt: string;
  meetingLink?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CareersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/careers`;

  // Signals
  jobs = signal<JobPosting[]>([]);
  applications = signal<JobApplication[]>([]);
  loading = signal<boolean>(false);
  selectedApplication = signal<JobApplication | null>(null);

  // Jobs
  loadJobs(): Observable<JobPosting[]> {
    this.loading.set(true);
    return this.http.get<JobPosting[]>(`${this.apiUrl}/jobs`).pipe(
      tap({
        next: (res) => {
          this.jobs.set(res || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  createJob(dto: UpsertJobPostingDto): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs`, dto).pipe(
      tap(() => this.loadJobs().subscribe())
    );
  }

  updateJob(id: string, dto: UpsertJobPostingDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/jobs/${id}`, dto).pipe(
      tap(() => this.loadJobs().subscribe())
    );
  }

  deleteJob(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/jobs/${id}`).pipe(
      tap(() => this.loadJobs().subscribe())
    );
  }

  // Applications
  loadApplications(stage?: string, page: number = 1, pageSize: number = 50): Observable<JobApplication[]> {
    this.loading.set(true);
    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    if (stage && stage !== 'ALL') {
      params = params.set('stage', stage);
    }

    return this.http.get<JobApplication[]>(`${this.apiUrl}/applications`, { params }).pipe(
      tap({
        next: (res) => {
          this.applications.set(res || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  getApplicationById(id: string): Observable<JobApplication> {
    return this.http.get<JobApplication>(`${this.apiUrl}/applications/${id}`).pipe(
      tap((app) => this.selectedApplication.set(app))
    );
  }

  updateStage(id: string, dto: UpdateApplicationStageDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/applications/${id}/stage`, dto).pipe(
      tap(() => {
        this.loadApplications().subscribe();
        if (this.selectedApplication()?.id === id) {
          this.getApplicationById(id).subscribe();
        }
      })
    );
  }

  addNote(id: string, dto: AddApplicationNoteDto): Observable<ApplicationNote> {
    return this.http.post<ApplicationNote>(`${this.apiUrl}/applications/${id}/notes`, dto).pipe(
      tap(() => {
        if (this.selectedApplication()?.id === id) {
          this.getApplicationById(id).subscribe();
        }
      })
    );
  }

  scheduleInterview(id: string, dto: ScheduleInterviewDto): Observable<ApplicationInterview> {
    return this.http.post<ApplicationInterview>(`${this.apiUrl}/applications/${id}/interviews`, dto).pipe(
      tap(() => {
        if (this.selectedApplication()?.id === id) {
          this.getApplicationById(id).subscribe();
        }
      })
    );
  }
}
