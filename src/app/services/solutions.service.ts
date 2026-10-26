import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SolutionSpec {
  id?: string;
  specText: string;
  sortOrder?: number;
}

export interface SolutionApplication {
  id?: string;
  applicationName: string;
  sortOrder?: number;
}

export interface SolutionDiscipline {
  id: string;
  disciplineNumber: string;
  categoryName: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  sortOrder: number;
  specs: SolutionSpec[];
  applications: SolutionApplication[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertSolutionDto {
  disciplineNumber: string;
  categoryName: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  sortOrder: number;
  specs: string[];
  applications: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SolutionsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/solutions`;

  public getAll(): Observable<SolutionDiscipline[]> {
    return this.http.get<SolutionDiscipline[]>(this.apiUrl);
  }

  public getById(id: string): Observable<SolutionDiscipline> {
    return this.http.get<SolutionDiscipline>(`${this.apiUrl}/${id}`);
  }

  public create(dto: UpsertSolutionDto): Observable<SolutionDiscipline> {
    return this.http.post<SolutionDiscipline>(this.apiUrl, dto);
  }

  public update(id: string, dto: UpsertSolutionDto): Observable<SolutionDiscipline> {
    return this.http.put<SolutionDiscipline>(`${this.apiUrl}/${id}`, dto);
  }

  public delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
