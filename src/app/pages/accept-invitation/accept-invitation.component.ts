import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../services/theme.service';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

interface InvitationInfo {
  isValid: boolean;
  email: string;
  fullName: string;
  assignedRole: string;
  invitedByAdminName: string;
  errorMessage?: string;
}

@Component({

  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './accept-invitation.component.html',
  styleUrl: './accept-invitation.component.scss'
})
export class AcceptInvitationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  public themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  public token = signal<string>('');
  public state = signal<'loading' | 'valid' | 'error'>('loading');
  public errorMessage = signal<string>('');
  public details = signal<InvitationInfo | null>(null);
  public isSubmitting = signal(false);

  public form = this.fb.group({
    fullName: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  public hasLength = signal(false);
  public hasUpper = signal(false);
  public hasLower = signal(false);
  public hasDigit = signal(false);
  public hasSymbol = signal(false);
  public passwordsMatch = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const rawToken = params['token'];
      if (!rawToken) {
        this.errorMessage.set('Missing invitation token in URL query parameters.');
        this.state.set('error');
        return;
      }
      this.token.set(rawToken.trim());
      this.validateToken(rawToken.trim());
    });

    this.form.valueChanges.subscribe(val => {
      const pwd = val.password || '';
      const confirmPwd = val.confirmPassword || '';

      this.hasLength.set(pwd.length >= 8);
      this.hasUpper.set(/[A-Z]/.test(pwd));
      this.hasLower.set(/[a-z]/.test(pwd));
      this.hasDigit.set(/[0-9]/.test(pwd));
      this.hasSymbol.set(/[^A-Za-z0-9]/.test(pwd));
      this.passwordsMatch.set(pwd.length > 0 && pwd === confirmPwd);
    });
  }

  public isFormValid(): boolean {
    return this.hasLength() &&
      this.hasUpper() &&
      this.hasLower() &&
      this.hasDigit() &&
      this.hasSymbol() &&
      this.passwordsMatch() &&
      !!this.form.get('fullName')?.value;
  }

  private validateToken(tokenStr: string): void {
    this.http.get<InvitationInfo>(`${environment.apiUrl}/admin/auth/invitation-info?token=${encodeURIComponent(tokenStr)}`)
      .subscribe({
        next: (res) => {
          if (!res.isValid) {
            this.errorMessage.set(res.errorMessage || 'This invitation has expired or has already been accepted.');
            this.state.set('error');
          } else {
            this.details.set(res);
            this.form.patchValue({ fullName: res.fullName });
            this.state.set('valid');
          }
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Unable to communicate with the verification authority.');
          this.state.set('error');
        }
      });
  }

  public onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const payload = {
      token: this.token(),
      password: this.form.get('password')?.value,
      confirmPassword: this.form.get('confirmPassword')?.value
    };

    this.http.post<LoginResponse>(`${environment.apiUrl}/admin/auth/accept-invitation`, payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          // Store session
          if (res && res.token) {
            localStorage.setItem('4digitcore_auth_token', res.token);
            if (res.refreshToken) {
              localStorage.setItem('4digitcore_refresh_token', res.refreshToken);
            }
            localStorage.setItem('4digitcore_admin_user', JSON.stringify(res));
          }
          this.toastService.success('Access Granted', 'Your administrative account has been activated!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err.error?.message || 'Failed to activate invitation.';
          this.toastService.error('Activation Error', msg);
        }
      });
  }
}
