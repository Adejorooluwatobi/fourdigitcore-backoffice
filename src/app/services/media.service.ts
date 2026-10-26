import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadMediaResult {
  success: boolean;
  url: string;
  publicId?: string;
  format?: string;
  bytes?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private uploadUrl = `${environment.apiUrl}/admin/media/upload`;

  /**
   * Uploads an image or document from PC to Cloudinary CDN (with local fallback).
   */
  upload(file: File, folder: string = 'fourdigitcore'): Observable<UploadMediaResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<UploadMediaResult>(`${this.uploadUrl}?folder=${encodeURIComponent(folder)}`, formData);
  }

  /**
   * Resolves an image URL so it renders properly in the admin portal.
   * Handles Cloudinary CDN URLs, local fallback URLs, and relative paths.
   */
  resolveUrl(url: string | null | undefined): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      // Local server fallback URL (e.g., /uploads/...)
      const apiBase = environment.apiUrl.replace(/\/api\/v\d+$/i, '').replace(/\/api$/i, '');
      return `${apiBase}${trimmed}`;
    }
    return trimmed;
  }
}
