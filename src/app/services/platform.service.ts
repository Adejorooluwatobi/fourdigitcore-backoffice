import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HomeHeroSection {
  id?: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  latencyCeilingValue: string;
  latencyCeilingLabel: string;
  stateModelValue: string;
  stateModelLabel: string;
  enclaveSecurityValue: string;
  enclaveSecurityLabel: string;
}

export interface HomeHeroSlide {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

export interface PlatformPillarSpec {
  id?: string;
  specText: string;
  sortOrder?: number;
}

export interface PlatformPillarApplication {
  id?: string;
  applicationName: string;
  sortOrder?: number;
}

export interface PlatformPillar {
  id: string;
  layerNumber: string;
  badgeText: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  specs: PlatformPillarSpec[];
  applications: PlatformPillarApplication[];
}

export interface UpsertPlatformPillarDto {
  layerNumber: string;
  badgeText: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  specs: string[];
  applications: string[];
}

export interface HomeQuoteSection {
  id?: string;
  quoteText: string;
  attribution: string;
  invariantTerm: string;
}

export interface HomeClosingCallout {
  id?: string;
  badgeText: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
}

export interface PlatformOverview {
  hero: HomeHeroSection | null;
  slides: HomeHeroSlide[];
  quote: HomeQuoteSection | null;
  pillars: PlatformPillar[];
  closingCallout: HomeClosingCallout | null;
}

export interface SdkCategory {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface SdkSnippet {
  id: string;
  languageKey: string;
  displayName: string;
  categorySlug: string;
  fileName: string;
  bindingTag: string;
  packageTag: string;
  memoryTag: string;
  threadsTag: string;
  sortOrder: number;
  codeContent: string;
}

export interface SdkShowcase {
  sectionKey: string;
  badgeText: string;
  title: string;
  description: string;
  categories: SdkCategory[];
  snippets: SdkSnippet[];
}

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/platform`;
  private sdkAdminUrl = `${environment.apiUrl}/admin/sdk`;
  private sdkPublicUrl = `${environment.apiUrl}/v1/sdk-showcase`;

  public getOverview(): Observable<PlatformOverview> {
    return this.http.get<PlatformOverview>(this.apiUrl);
  }

  public updateHero(dto: Partial<HomeHeroSection>): Observable<any> {
    return this.http.put(`${this.apiUrl}/hero`, dto);
  }

  public addSlide(dto: { imageUrl: string; altText: string; sortOrder: number }): Observable<HomeHeroSlide> {
    return this.http.post<HomeHeroSlide>(`${this.apiUrl}/slides`, dto);
  }

  public deleteSlide(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/slides/${id}`);
  }

  public getPillars(): Observable<PlatformPillar[]> {
    return this.http.get<PlatformPillar[]>(`${this.apiUrl}/pillars`);
  }

  public createPillar(dto: UpsertPlatformPillarDto): Observable<PlatformPillar> {
    return this.http.post<PlatformPillar>(`${this.apiUrl}/pillars`, dto);
  }

  public updatePillar(id: string, dto: UpsertPlatformPillarDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/pillars/${id}`, dto);
  }

  public deletePillar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pillars/${id}`);
  }

  public updateQuote(dto: Partial<HomeQuoteSection>): Observable<any> {
    return this.http.put(`${this.apiUrl}/quote`, dto);
  }

  public updateClosingCallout(dto: Partial<HomeClosingCallout>): Observable<any> {
    return this.http.put(`${this.apiUrl}/callout`, dto);
  }

  // SDK Showcase
  public getSdkShowcase(): Observable<SdkShowcase> {
    return this.http.get<SdkShowcase>(this.sdkPublicUrl);
  }

  public updateSdkSection(dto: { badgeText: string; title: string; description: string }): Observable<any> {
    return this.http.put(`${this.sdkAdminUrl}/section`, dto);
  }

  public createSdkCategory(dto: { slug: string; name: string; sortOrder: number }): Observable<any> {
    return this.http.post(`${this.sdkAdminUrl}/categories`, dto);
  }

  public updateSdkCategory(id: string, dto: { slug: string; name: string; sortOrder: number }): Observable<any> {
    return this.http.put(`${this.sdkAdminUrl}/categories/${id}`, dto);
  }

  public deleteSdkCategory(id: string): Observable<any> {
    return this.http.delete(`${this.sdkAdminUrl}/categories/${id}`);
  }

  public createSdkSnippet(dto: any): Observable<any> {
    return this.http.post(`${this.sdkAdminUrl}/snippets`, dto);
  }

  public updateSdkSnippet(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.sdkAdminUrl}/snippets/${id}`, dto);
  }

  public deleteSdkSnippet(id: string): Observable<any> {
    return this.http.delete(`${this.sdkAdminUrl}/snippets/${id}`);
  }
}
