import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  public themeService = inject(ThemeService);
  public authService = inject(AuthService);

  public isProfileMenuOpen = signal(false);

  public toggleProfileMenu(): void {
    this.isProfileMenuOpen.update(v => !v);
  }

  public getInitials(): string {
    const name = this.authService.currentUser()?.fullName;
    if (!name) return 'OA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  public logout(): void {
    this.isProfileMenuOpen.set(false);
    this.authService.logout();
  }
}
