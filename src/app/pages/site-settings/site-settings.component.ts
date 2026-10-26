import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  SiteSettingsService, 
  SiteSettingsOverview, 
  NavItem, 
  FooterColumn,
  PageSettings
} from '../../services/site-settings.service';
import { ToastService } from '../../services/toast.service';
import { ImageUploaderComponent } from '../../shared/image-uploader/image-uploader.component';

@Component({
  selector: 'app-site-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImageUploaderComponent],
  templateUrl: './site-settings.component.html',
  styleUrl: './site-settings.component.scss'
})
export class SiteSettingsComponent implements OnInit {
  private siteSettingsService = inject(SiteSettingsService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  public activeTab = signal<'branding' | 'navigation' | 'footer' | 'tickers' | 'seo'>('branding');
  public isLoading = signal(false);
  public isSaving = signal(false);

  public navItems = signal<NavItem[]>([]);
  public footerColumns = signal<FooterColumn[]>([]);
  public pageSettingsList = signal<PageSettings[]>([]);
  public selectedPageKey = signal<string>('index');

  public readonly platformPages = [
    { key: 'index', name: 'Homepage', path: '/', defaultTitle: 'FourDigitCore 6174 // Autonomous Compute & Zero-Trust Systems' },
    { key: 'solutions', name: 'Solutions & Disciplines', path: '/solutions.html', defaultTitle: 'Solutions & Architectural Disciplines // FourDigitCore 6174' },
    { key: 'about', name: 'Philosophy & Leadership', path: '/about.html', defaultTitle: 'Philosophy & Mathematical Invariance // FourDigitCore 6174' },
    { key: 'innovation', name: 'Research Labs & Silicon', path: '/innovation.html', defaultTitle: 'Research Labs & TSMC Photonic Tape-Outs // FourDigitCore 6174' },
    { key: 'academy', name: 'Systems Academy', path: '/academy.html', defaultTitle: 'Systems Academy & Fellowships // FourDigitCore 6174' },
    { key: 'careers', name: 'Careers & Talent', path: '/careers.html', defaultTitle: 'Careers & Systems Engineering Tracks // FourDigitCore 6174' },
    { key: 'contact', name: 'Briefing Console', path: '/contact.html', defaultTitle: 'Architectural Briefing Console // FourDigitCore 6174' }
  ];

  // Settings Form
  public settingsForm: FormGroup = this.fb.group({
    siteTitle: ['', Validators.required],
    monogram: ['6174'],
    logoLightUrl: [''],
    logoDarkUrl: [''],
    faviconUrl: [''],
    defaultTheme: ['light'],
    metaDescription: [''],
    copyrightText: [''],
    footerTagline: [''],
    kernelStatusBadge: [''],
    latencyTickerText: [''],
    activeClusterText: [''],
    invarianceObservedText: ['']
  });

  // Nav Form
  public isNavDrawerOpen = false;
  public editingNavId: string | null = null;
  public navForm: FormGroup = this.fb.group({
    label: ['', Validators.required],
    url: ['', Validators.required],
    dataPage: ['', Validators.required],
    sortOrder: [1],
    isActive: [true]
  });

  // Footer Drawer
  public isFooterDrawerOpen = false;
  public editingColId: string | null = null;

  // Page SEO Form
  public seoForm: FormGroup = this.fb.group({
    pageKey: ['index', Validators.required],
    seoTitle: ['', [Validators.required, Validators.maxLength(120)]],
    seoDescription: ['', [Validators.required, Validators.maxLength(320)]],
    heroBadgeText: [''],
    heroHeading: [''],
    heroSubtitle: ['']
  });

  ngOnInit() {
    this.loadAllData();
  }

  public loadAllData() {
    this.isLoading.set(true);
    this.siteSettingsService.getOverview().subscribe({
      next: (data: SiteSettingsOverview) => {
        if (data.settings) {
          this.settingsForm.patchValue(data.settings);
        }
        if (data.navItems) {
          this.navItems.set(data.navItems);
        }
        if (data.footerColumns) {
          this.footerColumns.set(data.footerColumns);
        }
        if (data.pageSettings) {
          this.pageSettingsList.set(data.pageSettings);
          this.selectPage(this.selectedPageKey());
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load site branding data.');
        this.isLoading.set(false);
      }
    });
  }

  public selectPage(pageKey: string) {
    this.selectedPageKey.set(pageKey);
    const existing = this.pageSettingsList().find(p => p.pageKey.toLowerCase() === pageKey.toLowerCase());
    const pageMeta = this.platformPages.find(p => p.key === pageKey);

    if (existing) {
      this.seoForm.patchValue({
        pageKey: existing.pageKey,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
        heroBadgeText: existing.heroBadgeText || '',
        heroHeading: existing.heroHeading || '',
        heroSubtitle: existing.heroSubtitle || ''
      });
    } else {
      this.seoForm.reset({
        pageKey: pageKey,
        seoTitle: pageMeta?.defaultTitle || '',
        seoDescription: 'FourDigitCore deterministic autonomous compute and zero-trust invariant systems.',
        heroBadgeText: '',
        heroHeading: '',
        heroSubtitle: ''
      });
    }
  }

  public savePageSeo() {
    if (this.seoForm.invalid) {
      this.toast.error('Validation Error', 'Please provide both an SEO Title and Meta Description.');
      return;
    }
    this.isSaving.set(true);
    const pageKey = this.selectedPageKey();
    const payload = this.seoForm.value;

    this.siteSettingsService.updatePageSettings(pageKey, payload).subscribe({
      next: () => {
        this.toast.success('SEO Updated', `SEO metadata for '${pageKey}' saved to database.`);
        this.isSaving.set(false);
        this.loadAllData();
      },
      error: (err) => {
        this.toast.error('Save Failed', err.error?.message || 'Failed to update page SEO configuration.');
        this.isSaving.set(false);
      }
    });
  }

  public saveSettings() {
    if (this.settingsForm.invalid) return;
    this.isSaving.set(true);
    this.siteSettingsService.updateSettings(this.settingsForm.value).subscribe({
      next: () => {
        this.toast.success('Site branding and status tickers updated.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update site branding.');
        this.isSaving.set(false);
      }
    });
  }

  // Nav
  public openNavDrawer(n?: NavItem) {
    if (n) {
      this.editingNavId = n.id;
      this.navForm.patchValue({
        label: n.label,
        url: n.url,
        dataPage: n.dataPage,
        sortOrder: n.sortOrder || 1,
        isActive: n.isActive
      });
    } else {
      this.editingNavId = null;
      this.navForm.reset({
        label: '',
        url: '',
        dataPage: '',
        sortOrder: this.navItems().length + 1,
        isActive: true
      });
    }
    this.isNavDrawerOpen = true;
  }

  public saveNavItem() {
    if (this.navForm.invalid) return;
    this.isSaving.set(true);
    const payload = this.navForm.value;

    if (this.editingNavId) {
      this.siteSettingsService.updateNavItem(this.editingNavId, payload).subscribe({
        next: () => {
          this.toast.success('Navigation item updated.');
          this.isNavDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to update navigation item.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.siteSettingsService.createNavItem(payload).subscribe({
        next: () => {
          this.toast.success('Navigation item added.');
          this.isNavDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to add navigation item.');
          this.isSaving.set(false);
        }
      });
    }
  }

  public deleteNavItem(id: string) {
    this.siteSettingsService.deleteNavItem(id).subscribe({
      next: () => {
        this.toast.success('Navigation item removed.');
        this.loadAllData();
      }
    });
  }

  // Footer
  public openFooterDrawer(col?: FooterColumn) {
    this.toast.info('Footer column configuration.');
  }

  public deleteFooterColumn(id: string) {
    this.siteSettingsService.deleteFooterColumn(id).subscribe({
      next: () => {
        this.toast.success('Footer column removed.');
        this.loadAllData();
      }
    });
  }
}
