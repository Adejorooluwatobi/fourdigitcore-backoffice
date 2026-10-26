import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({

  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  public isSubmitting = signal(false);

  public passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPassword: ['', [Validators.required]]
  });

  public hasLength = signal(false);
  public hasUpper = signal(false);
  public hasLower = signal(false);
  public hasDigit = signal(false);
  public hasSymbol = signal(false);
  public passwordsMatch = signal(false);

  constructor() {
    this.passwordForm.valueChanges.subscribe(val => {
      const pwd = val.newPassword || '';
      const confirmPwd = val.confirmNewPassword || '';

      this.hasLength.set(pwd.length >= 8);
      this.hasUpper.set(/[A-Z]/.test(pwd));
      this.hasLower.set(/[a-z]/.test(pwd));
      this.hasDigit.set(/[0-9]/.test(pwd));
      this.hasSymbol.set(/[^A-Za-z0-9]/.test(pwd));
      this.passwordsMatch.set(pwd.length > 0 && pwd === confirmPwd);
    });
  }

  public getInitials(): string {
    const name = this.authService.currentUser()?.fullName;
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  public isFormValid(): boolean {
    return this.hasLength() &&
      this.hasUpper() &&
      this.hasLower() &&
      this.hasDigit() &&
      this.hasSymbol() &&
      this.passwordsMatch() &&
      !!this.passwordForm.get('currentPassword')?.value;
  }

  public onChangePassword(): void {
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success('Security Updated', 'Password successfully changed.');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Password update failed. Verify your current password.';
        this.toastService.error('Error', msg);
      }
    });
  }
}
