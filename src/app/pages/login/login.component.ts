import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({

  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  public showPassword = signal(false);
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  public isEmailFocused = false;
  public isPasswordFocused = false;

  public loginForm = this.fb.group({
    email: ['Adejorotgold1@yahoo.com', [Validators.required, Validators.email]],
    password: ['AdminPassword123!', [Validators.required]]
  });

  public autofillDefault(): void {
    this.loginForm.patchValue({
      email: 'Adejorotgold1@yahoo.com',
      password: 'AdminPassword123!'
    });
    this.toastService.info('Credentials Ready', 'Seeded root SuperAdmin keys populated');
  }

  public onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success(
          'Authentication Granted', 
          `Welcome to the Control Plane, ${res.fullName}`
        );
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Authentication failed. Please verify credentials.';
        this.errorMessage.set(msg);
        this.toastService.error('Sign In Error', msg);
      }
    });
  }
}
