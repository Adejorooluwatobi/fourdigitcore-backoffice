import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { DashboardService, DashboardOverview, DashboardActivity } from '../../services/dashboard.service';

export interface StatMetric {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  secondaryText?: string;
  unreadCount?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  public isLoading = signal(false);

  public stats = signal<StatMetric[]>([
    { title: 'Active Operators', value: 0, change: 'Active Accounts', trend: 'up', color: '#38bdf8' },
    { title: 'Enterprise Inquiries', value: 0, change: '0 unread', trend: 'up', color: '#00f2fe' },
    { title: 'Dynamic Solutions', value: 0, change: '100% Live', trend: 'up', color: '#a855f7' },
    { title: 'System Telemetry', value: '99.8%', change: '0.38ms Latency', trend: 'up', color: '#10b981', secondaryText: 'Uptime' }
  ]);

  public activities = signal<DashboardActivity[]>([]);

  ngOnInit(): void {
    this.refreshData();
  }

  public refreshData(): void {
    this.isLoading.set(true);

    this.dashboardService.getDashboardOverview().subscribe({
      next: (data: DashboardOverview) => {
        const s = data.stats;
        this.stats.set([
          {
            title: 'Active Operators',
            value: s.activeOperators,
            change: s.activeOperators > 1 ? `${s.activeOperators} Admins Active` : '1 SuperAdmin Active',
            trend: 'up',
            color: '#38bdf8'
          },
          {
            title: 'Enterprise Inquiries',
            value: s.totalInquiries,
            change: `${s.unreadInquiries} unread`,
            trend: s.unreadInquiries > 0 ? 'up' : 'neutral',
            color: '#00f2fe',
            unreadCount: s.unreadInquiries
          },
          {
            title: 'Dynamic Solutions',
            value: s.dynamicSolutions,
            change: `${s.totalCodeSnippets} SDK Snippets Live`,
            trend: 'up',
            color: '#a855f7'
          },
          {
            title: 'System Telemetry',
            value: `${s.systemUptimePercent}%`,
            change: `${s.averageLatencyMs}ms Latency`,
            trend: 'up',
            color: '#10b981',
            secondaryText: 'Uptime'
          }
        ]);

        this.activities.set(data.recentActivities || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Dashboard Error', 'Failed to retrieve real-time analytics data.');
      }
    });
  }

  public navigateToAction(item: DashboardActivity, action: 'edit' | 'view' | 'manage'): void {
    if (item.actionUrl) {
      this.router.navigate([item.actionUrl]);
    }
  }
}
