import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AboutHeroSection {
  id?: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  heroImageUrl: string;
  heroHudPill: string;
  equilibriumText: string;
  clusterStateText: string;
}

export interface AboutStorySection {
  id?: string;
  badgeText: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
}

export interface ArchitectProfile {
  id?: string;
  initials: string;
  fullName: string;
  roleTitle: string;
  pgpKey: string;
  quote: string;
  commitsCountText: string;
  patentsCountText: string;
  releasesCountText: string;
  avatarUrl?: string;
}

export interface TeamMember {
  id: string;
  fullName: string;
  roleTitle: string;
  bio: string;
  avatarUrl?: string;
  pgpFingerprint?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AboutOverview {
  hero: AboutHeroSection | null;
  story: AboutStorySection | null;
  architect: ArchitectProfile | null;
  teamMembers: TeamMember[];
}

@Injectable({
  providedIn: 'root'
})
export class AboutService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/about`;

  public getOverview(): Observable<AboutOverview> {
    return this.http.get<AboutOverview>(this.apiUrl);
  }

  public updateHero(dto: Partial<AboutHeroSection>): Observable<any> {
    return this.http.put(`${this.apiUrl}/hero`, dto);
  }

  public updateStory(dto: Partial<AboutStorySection>): Observable<any> {
    return this.http.put(`${this.apiUrl}/story`, dto);
  }

  public updateArchitect(dto: Partial<ArchitectProfile>): Observable<any> {
    return this.http.put(`${this.apiUrl}/architect`, dto);
  }

  public createTeamMember(dto: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.post<TeamMember>(`${this.apiUrl}/team`, dto);
  }

  public updateTeamMember(id: string, dto: Partial<TeamMember>): Observable<any> {
    return this.http.put(`${this.apiUrl}/team/${id}`, dto);
  }

  public deleteTeamMember(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/team/${id}`);
  }
}
