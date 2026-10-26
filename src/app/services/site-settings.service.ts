import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SiteSettings {
  id?: string;
  siteTitle: string;
  monogram: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  defaultTheme: string;
  metaDescription: string;
  copyrightText: string;
  footerTagline: string;
  kernelStatusBadge: string;
  latencyTickerText: string;
  activeClusterText: string;
  invarianceObservedText: string;
}

export interface NavItem {
  id: string;
  label: string;
  url: string;
  dataPage: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FooterLink {
  id?: string;
  label: string;
  url: string;
  sortOrder: number;
}

export interface FooterColumn {
  id: string;
  title: string;
  sortOrder: number;
  links: FooterLink[];
}

export interface PageSettings {
  id?: string;
  pageKey: string;
  seoTitle: string;
  seoDescription: string;
  heroBadgeText?: string;
  heroHeading?: string;
  heroSubtitle?: string;
  updatedAt?: string;
}

export interface SiteSettingsOverview {
  settings: SiteSettings | null;
  navItems: NavItem[];
  footerColumns: FooterColumn[];
  pageSettings: PageSettings[];
}

@Injectable({
  providedIn: 'root'
})
export class SiteSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/site-settings`;

  public getOverview(): Observable<SiteSettingsOverview> {
    return this.http.get<SiteSettingsOverview>(this.apiUrl);
  }

  public updateSettings(dto: Partial<SiteSettings>): Observable<any> {
    return this.http.put(this.apiUrl, dto);
  }

  // Navigation
  public createNavItem(dto: Partial<NavItem>): Observable<NavItem> {
    return this.http.post<NavItem>(`${this.apiUrl}/nav`, dto);
  }

  public updateNavItem(id: string, dto: Partial<NavItem>): Observable<any> {
    return this.http.put(`${this.apiUrl}/nav/${id}`, dto);
  }

  public deleteNavItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/nav/${id}`);
  }

  // Footer
  public createFooterColumn(dto: any): Observable<FooterColumn> {
    return this.http.post<FooterColumn>(`${this.apiUrl}/footer`, dto);
  }

  public updateFooterColumn(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/footer/${id}`, dto);
  }

  public deleteFooterColumn(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/footer/${id}`);
  }

  // Page SEO Settings
  public getAllPageSettings(): Observable<PageSettings[]> {
    return this.http.get<PageSettings[]>(`${this.apiUrl}/pages`);
  }

  public getPageSettings(pageKey: string): Observable<PageSettings> {
    return this.http.get<PageSettings>(`${this.apiUrl}/pages/${pageKey}`);
  }

  public updatePageSettings(pageKey: string, dto: Partial<PageSettings>): Observable<any> {
    return this.http.put(`${this.apiUrl}/pages/${pageKey}`, dto);
  }
}

