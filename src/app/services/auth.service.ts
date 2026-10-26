import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  email: string;
  fullName: string;
  roles: string[];
  expiresAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = '4digitcore_auth_token';
  private readonly REFRESH_TOKEN_KEY = '4digitcore_refresh_token';
  private readonly USER_KEY = '4digitcore_admin_user';

  public currentUser = signal<LoginResponse | null>(this.getStoredUser());
  public token = signal<string | null>(this.getStoredToken());

  public isAuthenticated = computed(() => {
    const t = this.token();
    const u = this.currentUser();
    return !!t && !!u && this.isTokenNotExpired(u);
  });

  public isSuperAdmin = computed(() => {
    const u = this.currentUser();
    if (!u || !u.roles) return false;
    return u.roles.some(r => r.toUpperCase() === 'SUPERADMIN');
  });

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): LoginResponse | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      if (this.isTokenNotExpired(user)) {
        return user;
      }
      this.clearSession();
      return null;
    } catch {
      this.clearSession();
      return null;
    }
  }

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/admin/auth/login`, credentials).pipe(
      tap(res => {
        if (res && res.token) {
          this.setSession(res);
        }
      })
    );
  }

  public refreshToken(): Observable<LoginResponse> {
    const rawRefresh = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!rawRefresh) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(`${environment.apiUrl}/admin/auth/refresh-token`, { refreshToken: rawRefresh }).pipe(
      tap(res => {
        if (res && res.token) {
          this.setSession(res);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  public changePassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/admin/auth/change-password`, request);
  }

  public logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this.token.set(response.token);
    this.currentUser.set(response);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  private isTokenNotExpired(user: LoginResponse): boolean {
    if (!user || !user.token) return false;
    if (user.expiresAt) {
      const expDate = new Date(user.expiresAt).getTime();
      if (!isNaN(expDate) && Date.now() >= expDate) {
        return false;
      }
    }
    try {
      const payloadBase64 = user.token.split('.')[1];
      if (payloadBase64) {
        const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          return false;
        }
      }
    } catch {
      return false;
    }
    return true;
  }
}
