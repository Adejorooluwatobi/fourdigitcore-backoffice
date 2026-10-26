import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InquiriesService,
  ContactInquiry,
  UpdateInquiryStatusDto,
  AddInquiryNoteDto,
  ContactPageSettings,
  InquiryIntentOption,
  InquiryScaleOption,
  UpdateContactPageSettingsDto,
  UpsertInquiryIntentOptionDto,
  UpsertInquiryScaleOptionDto
} from '../../services/inquiries.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-inquiries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inquiries.component.html',
  styleUrl: './inquiries.component.scss'
})
export class InquiriesComponent implements OnInit {
  private inquiriesService = inject(InquiriesService);
  private toast = inject(ToastService);

  loading = this.inquiriesService.loading;
  inquiries = this.inquiriesService.inquiries;
  selected = this.inquiriesService.selectedInquiry;

  // View mode switcher: Inbound Submissions CRM vs Briefing Form Configuration
  activeView = signal<'submissions' | 'form-config'>('submissions');

  // Submissions CRM State
  currentTab = signal<'all' | 'unread' | 'resolved'>('all');
  selectedPriority = 'ALL';
  searchQuery = '';

  isDrawerOpen = signal<boolean>(false);
  editStatusValue = 'New';
  editPriorityValue = 'Normal';
  noteInput = '';
  inquiryToDelete = signal<ContactInquiry | null>(null);

  // Briefing Form Configuration State
  briefingLoading = signal<boolean>(false);
  briefingSettings = signal<ContactPageSettings | null>(null);
  intentOptions = signal<InquiryIntentOption[]>([]);
  scaleOptions = signal<InquiryScaleOption[]>([]);

  // Settings form fields
  settingsBadgeText = '';
  settingsHeadline = '';
  settingsSubheadline = '';
  settingsIntentLabel = '';
  settingsFeedbackSuccessText = '';
  savingSettings = signal<boolean>(false);

  // Intent modal state
  isIntentModalOpen = signal<boolean>(false);
  editingIntentId = signal<string | null>(null);
  intentKey = '';
  intentDisplayName = '';
  intentSortOrder = 0;
  intentIsActive = true;
  intentToDelete = signal<InquiryIntentOption | null>(null);

  // Scale modal state
  isScaleModalOpen = signal<boolean>(false);
  editingScaleId = signal<string | null>(null);
  scaleKey = '';
  scaleDisplayText = '';
  scaleSortOrder = 0;
  scaleIsActive = true;
  scaleToDelete = signal<InquiryScaleOption | null>(null);

  totalCount = computed(() => this.inquiries().length);
  unreadCount = computed(() => this.inquiries().filter(i => i.status === 'New').length);
  resolvedCount = computed(() => this.inquiries().filter(i => i.status === 'Resolved' || i.status === 'Archived').length);
  todayCount = computed(() => {
    const today = new Date().toDateString();
    return this.inquiries().filter(i => new Date(i.createdAt).toDateString() === today).length;
  });

  filteredInquiries = computed(() => {
    let result = this.inquiries();

    // Tab filter
    if (this.currentTab() === 'unread') {
      result = result.filter(i => i.status === 'New');
    } else if (this.currentTab() === 'resolved') {
      result = result.filter(i => i.status === 'Resolved' || i.status === 'Archived');
    }

    // Priority filter
    if (this.selectedPriority !== 'ALL') {
      result = result.filter(i => i.priority === this.selectedPriority);
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(i => 
        i.fullName.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        (i.organization && i.organization.toLowerCase().includes(q)) ||
        i.scaleCategory.toLowerCase().includes(q)
      );
    }

    return result;
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.inquiriesService.loadInquiries().subscribe({
      error: () => this.toast.error('Failed to load inquiries')
    });
  }

  openInquiryDetail(item: ContactInquiry) {
    this.inquiriesService.getInquiryById(item.id).subscribe({
      next: (full) => {
        this.editStatusValue = full.status;
        this.editPriorityValue = full.priority;
        this.isDrawerOpen.set(true);
      },
      error: () => this.toast.error('Failed to load inquiry details')
    });
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.inquiriesService.selectedInquiry.set(null);
  }

  saveStatusChange(id: string) {
    const dto: UpdateInquiryStatusDto = {
      status: this.editStatusValue,
      priority: this.editPriorityValue,
      assignedAdminName: 'System SuperAdmin'
    };

    this.inquiriesService.updateStatus(id, dto).subscribe({
      next: () => this.toast.success('Inquiry status updated'),
      error: () => this.toast.error('Failed to update status')
    });
  }

  submitNote(id: string) {
    if (!this.noteInput.trim()) return;

    const dto: AddInquiryNoteDto = {
      content: this.noteInput.trim(),
      authorName: 'System SuperAdmin'
    };

    this.inquiriesService.addNote(id, dto).subscribe({
      next: () => {
        this.noteInput = '';
        this.toast.success('Note added');
      },
      error: () => this.toast.error('Failed to add note')
    });
  }

  confirmDelete(item: ContactInquiry) {
    this.inquiryToDelete.set(item);
  }

  executeDelete() {
    const item = this.inquiryToDelete();
    if (!item) return;

    this.inquiriesService.deleteInquiry(item.id).subscribe({
      next: () => {
        this.toast.success('Inquiry record deleted');
        this.inquiryToDelete.set(null);
        if (this.selected()?.id === item.id) {
          this.closeDrawer();
        }
      },
      error: () => this.toast.error('Failed to delete inquiry')
    });
  }

  // --- Briefing Form Config Actions ---

  switchView(view: 'submissions' | 'form-config') {
    this.activeView.set(view);
    if (view === 'form-config' && !this.briefingSettings()) {
      this.loadBriefingConfig();
    }
  }

  loadBriefingConfig() {
    this.briefingLoading.set(true);
    this.inquiriesService.getBriefingFormConfig().subscribe({
      next: (res) => {
        this.briefingSettings.set(res.settings);
        this.intentOptions.set(res.intentOptions || []);
        this.scaleOptions.set(res.scaleOptions || []);

        if (res.settings) {
          this.settingsBadgeText = res.settings.badgeText || '';
          this.settingsHeadline = res.settings.headline || '';
          this.settingsSubheadline = res.settings.subheadline || '';
          this.settingsIntentLabel = res.settings.intentLabel || '';
          this.settingsFeedbackSuccessText = res.settings.feedbackSuccessText || '';
        }
        this.briefingLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load contact briefing configuration');
        this.briefingLoading.set(false);
      }
    });
  }

  saveBriefingSettings() {
    if (!this.settingsHeadline.trim()) {
      this.toast.error('Headline is required');
      return;
    }

    this.savingSettings.set(true);
    const dto: UpdateContactPageSettingsDto = {
      badgeText: this.settingsBadgeText,
      headline: this.settingsHeadline,
      subheadline: this.settingsSubheadline,
      intentLabel: this.settingsIntentLabel,
      feedbackSuccessText: this.settingsFeedbackSuccessText
    };

    this.inquiriesService.updateBriefingSettings(dto).subscribe({
      next: (res) => {
        this.briefingSettings.set(res.settings);
        this.savingSettings.set(false);
        this.toast.success('Briefing console settings saved');
      },
      error: () => {
        this.savingSettings.set(false);
        this.toast.error('Failed to save briefing console settings');
      }
    });
  }

  // Intent Modal Handlers
  openIntentModal(item?: InquiryIntentOption) {
    if (item) {
      this.editingIntentId.set(item.id);
      this.intentKey = item.intentKey;
      this.intentDisplayName = item.displayName;
      this.intentSortOrder = item.sortOrder;
      this.intentIsActive = item.isActive;
    } else {
      this.editingIntentId.set(null);
      this.intentKey = '';
      this.intentDisplayName = '';
      this.intentSortOrder = this.intentOptions().length + 1;
      this.intentIsActive = true;
    }
    this.isIntentModalOpen.set(true);
  }

  closeIntentModal() {
    this.isIntentModalOpen.set(false);
    this.editingIntentId.set(null);
  }

  saveIntent() {
    if (!this.intentKey.trim() || !this.intentDisplayName.trim()) {
      this.toast.error('Intent key and display name are required');
      return;
    }

    const dto: UpsertInquiryIntentOptionDto = {
      intentKey: this.intentKey.trim().toLowerCase(),
      displayName: this.intentDisplayName.trim(),
      sortOrder: Number(this.intentSortOrder),
      isActive: this.intentIsActive
    };

    const id = this.editingIntentId();
    if (id) {
      this.inquiriesService.updateIntentOption(id, dto).subscribe({
        next: () => {
          this.toast.success('Intent option updated');
          this.closeIntentModal();
          this.loadBriefingConfig();
        },
        error: () => this.toast.error('Failed to update intent option')
      });
    } else {
      this.inquiriesService.createIntentOption(dto).subscribe({
        next: () => {
          this.toast.success('Intent option added');
          this.closeIntentModal();
          this.loadBriefingConfig();
        },
        error: () => this.toast.error('Failed to create intent option')
      });
    }
  }

  confirmDeleteIntent(item: InquiryIntentOption) {
    this.intentToDelete.set(item);
  }

  executeDeleteIntent() {
    const item = this.intentToDelete();
    if (!item) return;

    this.inquiriesService.deleteIntentOption(item.id).subscribe({
      next: () => {
        this.toast.success('Intent option deleted');
        this.intentToDelete.set(null);
        this.loadBriefingConfig();
      },
      error: () => this.toast.error('Failed to delete intent option')
    });
  }

  // Scale Modal Handlers
  openScaleModal(item?: InquiryScaleOption) {
    if (item) {
      this.editingScaleId.set(item.id);
      this.scaleKey = item.scaleKey;
      this.scaleDisplayText = item.displayText;
      this.scaleSortOrder = item.sortOrder;
      this.scaleIsActive = item.isActive;
    } else {
      this.editingScaleId.set(null);
      this.scaleKey = '';
      this.scaleDisplayText = '';
      this.scaleSortOrder = this.scaleOptions().length + 1;
      this.scaleIsActive = true;
    }
    this.isScaleModalOpen.set(true);
  }

  closeScaleModal() {
    this.isScaleModalOpen.set(false);
    this.editingScaleId.set(null);
  }

  saveScale() {
    if (!this.scaleKey.trim() || !this.scaleDisplayText.trim()) {
      this.toast.error('Scale key and display text are required');
      return;
    }

    const dto: UpsertInquiryScaleOptionDto = {
      scaleKey: this.scaleKey.trim().toUpperCase(),
      displayText: this.scaleDisplayText.trim(),
      sortOrder: Number(this.scaleSortOrder),
      isActive: this.scaleIsActive
    };

    const id = this.editingScaleId();
    if (id) {
      this.inquiriesService.updateScaleOption(id, dto).subscribe({
        next: () => {
          this.toast.success('Scale option updated');
          this.closeScaleModal();
          this.loadBriefingConfig();
        },
        error: () => this.toast.error('Failed to update scale option')
      });
    } else {
      this.inquiriesService.createScaleOption(dto).subscribe({
        next: () => {
          this.toast.success('Scale option added');
          this.closeScaleModal();
          this.loadBriefingConfig();
        },
        error: () => this.toast.error('Failed to create scale option')
      });
    }
  }

  confirmDeleteScale(item: InquiryScaleOption) {
    this.scaleToDelete.set(item);
  }

  executeDeleteScale() {
    const item = this.scaleToDelete();
    if (!item) return;

    this.inquiriesService.deleteScaleOption(item.id).subscribe({
      next: () => {
        this.toast.success('Scale option deleted');
        this.scaleToDelete.set(null);
        this.loadBriefingConfig();
      },
      error: () => this.toast.error('Failed to delete scale option')
    });
  }
}
