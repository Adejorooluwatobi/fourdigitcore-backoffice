import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  activeOperators: number;
  totalInquiries: number;
  unreadInquiries: number;
  dynamicSolutions: number;
  systemUptimePercent: number;
  averageLatencyMs: number;
  totalJobApplicants: number;
  activeCohorts: number;
  totalWhitepapers: number;
  totalCodeSnippets: number;
}

export interface DashboardActivity {
  id: string;
  title: string;
  category: string;
  status: 'Live' | 'Pending' | 'Review';
  date: string;
  actionUrl: string;
}

export interface SystemHealthSummary {
  totalNodes: number;
  onlineNodes: number;
  degradedNodes: number;
  activeAnnouncements: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivities: DashboardActivity[];
  systemHealth: SystemHealthSummary;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  public getDashboardOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(this.apiUrl);
  }
}
