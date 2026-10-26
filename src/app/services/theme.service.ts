import { Injectable, signal, computed, effect } from '@angular/core';

export type AppTheme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = '4digitcore_admin_theme';
  
  public currentTheme = signal<AppTheme>(this.getInitialTheme());

  public logoSrc = computed(() => {
    return this.currentTheme() === 'dark' 
      ? 'assets/img/logo-dark.png' 
      : 'assets/img/logo-light.png';
  });

  public isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  private getInitialTheme(): AppTheme {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(this.THEME_STORAGE_KEY) as AppTheme;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'dark'; // Default to 6174 Attractor Cyber Dark theme
  }

  public toggleTheme(): void {
    const nextTheme: AppTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  public setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.THEME_STORAGE_KEY, theme);
    }
    this.applyTheme(theme);
  }

  private applyTheme(theme: AppTheme): void {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      if (document.body) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      }
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      if (document.body) {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      }
    }
  }
}
