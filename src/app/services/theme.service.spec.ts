import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with dark theme by default', () => {
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(service.logoSrc()).toBe('assets/img/logo-dark.png');
  });

  it('should toggle theme from dark to light and swap logo', () => {
    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(service.logoSrc()).toBe('assets/img/logo-light.png');

    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(service.logoSrc()).toBe('assets/img/logo-dark.png');
  });
});
