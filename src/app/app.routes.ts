import { Routes } from '@angular/router';
import { authGuard, superAdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public Access Routes
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'accept-invitation',
    loadComponent: () => import('./pages/accept-invitation/accept-invitation.component').then(m => m.AcceptInvitationComponent)
  },

  // Authenticated Control Plane Shell Routes
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'platform',
        loadComponent: () => import('./pages/platform/platform.component').then(m => m.PlatformComponent)
      },
      {
        path: 'solutions',
        loadComponent: () => import('./pages/solutions/solutions.component').then(m => m.SolutionsComponent)
      },
      {
        path: 'innovation',
        loadComponent: () => import('./pages/innovation/innovation.component').then(m => m.InnovationComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
      },
      {
        path: 'academy',
        loadComponent: () => import('./pages/academy/academy.component').then(m => m.AcademyComponent)
      },
      {
        path: 'careers',
        loadComponent: () => import('./pages/careers/careers.component').then(m => m.CareersComponent)
      },
      {
        path: 'inquiries',
        loadComponent: () => import('./pages/inquiries/inquiries.component').then(m => m.InquiriesComponent)
      },
      {
        path: 'admin-users',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./pages/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'telemetry',
        loadComponent: () => import('./pages/telemetry/telemetry.component').then(m => m.TelemetryComponent)
      },
      {
        path: 'site-settings',
        loadComponent: () => import('./pages/site-settings/site-settings.component').then(m => m.SiteSettingsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },

  // Fallback Wildcard
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
