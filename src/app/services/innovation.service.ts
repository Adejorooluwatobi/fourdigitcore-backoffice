import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InnovationHeroSection {
  id?: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  heroImageUrl: string;
  labStatusPill: string;
  dieFabText: string;
  opticalWaveguideText: string;
  laneThroughputText: string;
  attractorStateText: string;
  jitterVarianceText: string;
}

export interface ConvergenceStep {
  id: string;
  stepNumberText: string;
  formulaText: string;
  subFormulaText?: string;
  description: string;
  isAttractor: boolean;
  sortOrder: number;
}

export interface ConvergenceSection {
  id?: string;
  badgeText: string;
  title: string;
  description: string;
  steps: ConvergenceStep[];
}

export interface Whitepaper {
  id: string;
  title: string;
  slug: string;
  authors: string;
  category: number | string;
  abstract: string;
  pdfUrl: string;
  version: string;
  downloadCount: number;
  isPublished: boolean;
  publishedAt: string;
}

export interface Patent {
  id: string;
  patentNumber: string;
  title: string;
  filingDate: string;
  grantDate?: string;
  status: number | string;
  abstract: string;
  inventors: string;
  docUrl?: string;
}

export interface Benchmark {
  id: string;
  subsystem: string;
  workloadType: string;
  throughputTps: number;
  latencyP50Ms: number;
  latencyP99Ms: number;
  invarianceCycles: number;
  reproducibilityRepoUrl?: string;
  benchmarkDate?: string;
}

export interface InnovationOverview {
  hero: InnovationHeroSection | null;
  convergence: ConvergenceSection | null;
  whitepapers: Whitepaper[];
  patents: Patent[];
  benchmarks: Benchmark[];
}

@Injectable({
  providedIn: 'root'
})
export class InnovationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/innovation`;

  public getOverview(): Observable<InnovationOverview> {
    return this.http.get<InnovationOverview>(this.apiUrl);
  }

  public updateHero(dto: Partial<InnovationHeroSection>): Observable<any> {
    return this.http.put(`${this.apiUrl}/hero`, dto);
  }

  public updateConvergence(dto: Partial<ConvergenceSection>): Observable<any> {
    return this.http.put(`${this.apiUrl}/convergence`, dto);
  }

  // Convergence Steps
  public createConvergenceStep(dto: Partial<ConvergenceStep>): Observable<ConvergenceStep> {
    return this.http.post<ConvergenceStep>(`${this.apiUrl}/convergence/steps`, dto);
  }

  public updateConvergenceStep(id: string, dto: Partial<ConvergenceStep>): Observable<any> {
    return this.http.put(`${this.apiUrl}/convergence/steps/${id}`, dto);
  }

  public deleteConvergenceStep(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/convergence/steps/${id}`);
  }

  // Whitepapers
  public createWhitepaper(dto: any): Observable<Whitepaper> {
    return this.http.post<Whitepaper>(`${this.apiUrl}/whitepapers`, dto);
  }

  public updateWhitepaper(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/whitepapers/${id}`, dto);
  }

  public deleteWhitepaper(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/whitepapers/${id}`);
  }

  // Patents
  public createPatent(dto: any): Observable<Patent> {
    return this.http.post<Patent>(`${this.apiUrl}/patents`, dto);
  }

  public updatePatent(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/patents/${id}`, dto);
  }

  public deletePatent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/patents/${id}`);
  }

  // Benchmarks
  public createBenchmark(dto: any): Observable<Benchmark> {
    return this.http.post<Benchmark>(`${this.apiUrl}/benchmarks`, dto);
  }

  public updateBenchmark(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/benchmarks/${id}`, dto);
  }

  public deleteBenchmark(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/benchmarks/${id}`);
  }
}
