import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  CareersService, 
  JobPosting, 
  UpsertJobPostingDto, 
  JobApplication,
  UpdateApplicationStageDto,
  AddApplicationNoteDto,
  ScheduleInterviewDto
} from '../../services/careers.service';
import { ToastService } from '../../services/toast.service';

@Component({

  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './careers.component.html',
  styleUrl: './careers.component.scss'
})
export class CareersComponent implements OnInit {
  private careersService = inject(CareersService);
  private toast = inject(ToastService);

  activeTab = signal<'jobs' | 'ats'>('jobs');
  viewMode = signal<'list' | 'grid'>('list');
  loading = this.careersService.loading;

  jobs = this.careersService.jobs;
  applications = this.careersService.applications;
  selectedApp = this.careersService.selectedApplication;

  // Search & Filters
  searchJobQuery = '';
  selectedLocation = 'ALL';
  selectedStatus = 'ALL';
  candidateStageFilter = signal<string>('ALL');

  // Job Drawer State
  isJobDrawerOpen = signal<boolean>(false);
  editingJobId = signal<string | null>(null);
  jobToDelete = signal<JobPosting | null>(null);
  jobTagsInput = '';

  jobForm: UpsertJobPostingDto = {
    departmentId: '00000000-0000-0000-0000-000000000000',
    title: '',
    slug: '',
    locationType: 'Remote',
    employmentType: 'FullTime',
    experienceLevel: 'Senior',
    description: '',
    requirements: '',
    techStackTags: '[]',
    status: 'Published',
    sortOrder: 1
  };

  // ATS Candidate Dossier State
  isDossierOpen = signal<boolean>(false);
  stageUpdateValue = 'Applied';
  ratingUpdateValue = 4;
  newNoteContent = '';

  interviewForm: ScheduleInterviewDto = {
    interviewerName: 'System SuperAdmin',
    stageName: 'Ring 0 Live Coding',
    scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    meetingLink: 'https://meet.google.com/ftd-core-sync'
  };

  stagesList = [
    { key: 'ALL', label: 'All Candidates' },
    { key: 'Applied', label: 'Applied' },
    { key: 'Screening', label: 'Screening' },
    { key: 'TechnicalInterview', label: 'Technical Interview' },
    { key: 'ArchitectureReview', label: 'Architecture Review' },
    { key: 'OfferExtended', label: 'Offer Extended' },
    { key: 'Hired', label: 'Hired' },
    { key: 'Rejected', label: 'Rejected' }
  ];

  candidateStages = [
    'Applied',
    'Screening',
    'TechnicalInterview',
    'ArchitectureReview',
    'OfferExtended',
    'Hired',
    'Rejected'
  ];

  formatEmploymentType(val: any): string {
    const s = String(val);
    if (s === '0' || s.toLowerCase() === 'fulltime') return 'Full-time';
    if (s === '1' || s.toLowerCase() === 'parttime') return 'Part-time';
    if (s === '2' || s.toLowerCase() === 'contract') return 'Contract';
    if (s === '3' || s.toLowerCase() === 'internship') return 'Internship';
    return s || 'Full-time';
  }

  formatLocationType(val: any): string {
    const s = String(val);
    if (s === '0' || s.toLowerCase() === 'remote') return 'Remote';
    if (s === '1' || s.toLowerCase() === 'hybrid') return 'Hybrid';
    if (s === '2' || s.toLowerCase() === 'onsite') return 'Onsite';
    return s || 'Remote';
  }

  formatExperienceLevel(val: any): string {
    const s = String(val);
    if (s === '0' || s.toLowerCase() === 'junior') return 'Junior (1-2 yrs)';
    if (s === '1' || s.toLowerCase() === 'mid') return 'Mid-level (3-4 yrs)';
    if (s === '2' || s.toLowerCase() === 'senior') return 'Senior (5+ yrs)';
    if (s === '3' || s.toLowerCase() === 'staff') return 'Staff Engineer';
    if (s === '4' || s.toLowerCase() === 'principal' || s.toLowerCase() === 'architect') return 'Principal Architect';
    return s || 'Senior';
  }

  formatStatus(val: any): string {
    const s = String(val);
    if (s === '1' || s.toLowerCase() === 'published') return 'Published';
    if (s === '0' || s.toLowerCase() === 'draft') return 'Draft';
    if (s === '2' || s.toLowerCase() === 'archived') return 'Archived';
    return s || 'Published';
  }

  isPublishedStatus(val: any): boolean {
    const s = String(val);
    return s === '1' || s.toLowerCase() === 'published';
  }

  isDraftStatus(val: any): boolean {
    const s = String(val);
    return s === '0' || s.toLowerCase() === 'draft';
  }

  filteredJobs = computed(() => {
    let result = this.jobs();
    if (this.searchJobQuery.trim()) {
      const q = this.searchJobQuery.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.techStackTags.toLowerCase().includes(q) ||
        j.slug.toLowerCase().includes(q)
      );
    }
    if (this.selectedLocation !== 'ALL') {
      result = result.filter(j => this.formatLocationType(j.locationType).toLowerCase() === this.selectedLocation.toLowerCase());
    }
    if (this.selectedStatus !== 'ALL') {
      result = result.filter(j => this.formatStatus(j.status).toLowerCase() === this.selectedStatus.toLowerCase());
    }
    return result;
  });

  filteredApplications = computed(() => {
    const stage = this.candidateStageFilter();
    if (stage === 'ALL') return this.applications();
    return this.applications().filter(a => a.status === stage);
  });

  countByStage(stageKey: string): number {
    if (stageKey === 'ALL') return this.applications().length;
    return this.applications().filter(a => a.status === stageKey).length;
  }

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.careersService.loadJobs().subscribe({
      error: () => this.toast.error('Failed to load engineering jobs')
    });
    this.careersService.loadApplications().subscribe({
      error: () => this.toast.error('Failed to load candidate applications')
    });
  }

  parseTags(tagsJson: string): string[] {
    try {
      if (tagsJson.startsWith('[')) {
        return JSON.parse(tagsJson);
      }
      return tagsJson.split(',').map(s => s.trim()).filter(Boolean);
    } catch {
      return [tagsJson];
    }
  }

  openJobDrawer(job?: JobPosting) {
    if (job) {
      this.editingJobId.set(job.id);
      this.jobForm = {
        departmentId: job.departmentId,
        title: job.title,
        slug: job.slug,
        locationType: job.locationType,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        description: job.description,
        requirements: job.requirements,
        techStackTags: job.techStackTags,
        status: job.status,
        sortOrder: job.sortOrder
      };
      this.jobTagsInput = this.parseTags(job.techStackTags).join(', ');
    } else {
      this.editingJobId.set(null);
      this.jobForm = {
        departmentId: '00000000-0000-0000-0000-000000000000',
        title: '',
        slug: '',
        locationType: 'Remote',
        employmentType: 'FullTime',
        experienceLevel: 'Senior',
        description: '',
        requirements: '',
        techStackTags: '[]',
        status: 'Published',
        sortOrder: this.jobs().length + 1
      };
      this.jobTagsInput = 'Rust, eBPF, Linux Kernel';
    }
    this.isJobDrawerOpen.set(true);
  }

  closeJobDrawer() {
    this.isJobDrawerOpen.set(false);
    this.editingJobId.set(null);
  }

  editJob(job: JobPosting) {
    this.openJobDrawer(job);
  }

  saveJob() {
    if (!this.jobForm.title.trim()) {
      this.toast.error('Role title is required');
      return;
    }

    const tagsArr = this.jobTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    this.jobForm.techStackTags = JSON.stringify(tagsArr);

    if (!this.jobForm.slug) {
      this.jobForm.slug = this.jobForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const editId = this.editingJobId();
    if (editId) {
      this.careersService.updateJob(editId, this.jobForm).subscribe({
        next: () => {
          this.toast.success('Engineering role updated successfully');
          this.closeJobDrawer();
        },
        error: () => this.toast.error('Failed to update role')
      });
    } else {
      this.careersService.createJob(this.jobForm).subscribe({
        next: () => {
          this.toast.success('New engineering role posted');
          this.closeJobDrawer();
        },
        error: () => this.toast.error('Failed to post role')
      });
    }
  }

  confirmDeleteJob(job: JobPosting) {
    this.jobToDelete.set(job);
  }

  executeDeleteJob() {
    const job = this.jobToDelete();
    if (!job) return;

    this.careersService.deleteJob(job.id).subscribe({
      next: () => {
        this.toast.success('Engineering role removed');
        this.jobToDelete.set(null);
      },
      error: () => this.toast.error('Failed to delete role')
    });
  }

  selectCandidateStage(stageKey: string) {
    this.candidateStageFilter.set(stageKey);
  }

  openCandidateDossier(app: JobApplication) {
    this.careersService.getApplicationById(app.id).subscribe({
      next: (fullApp) => {
        this.stageUpdateValue = fullApp.status;
        this.ratingUpdateValue = fullApp.rating || 4;
        this.isDossierOpen.set(true);
      },
      error: () => this.toast.error('Failed to load candidate dossier')
    });
  }

  closeDossier() {
    this.isDossierOpen.set(false);
    this.careersService.selectedApplication.set(null);
  }

  submitStageChange(appId: string) {
    const dto: UpdateApplicationStageDto = {
      stage: this.stageUpdateValue,
      rating: this.ratingUpdateValue
    };
    this.careersService.updateStage(appId, dto).subscribe({
      next: () => this.toast.success('Candidate pipeline stage updated'),
      error: () => this.toast.error('Failed to update stage')
    });
  }

  submitScheduleInterview(appId: string) {
    if (!this.interviewForm.interviewerName.trim()) {
      this.toast.error('Interviewer name is required');
      return;
    }
    this.careersService.scheduleInterview(appId, this.interviewForm).subscribe({
      next: () => this.toast.success('Technical interview scheduled'),
      error: () => this.toast.error('Failed to schedule interview')
    });
  }

  submitNote(appId: string) {
    if (!this.newNoteContent.trim()) return;

    const dto: AddApplicationNoteDto = {
      content: this.newNoteContent.trim(),
      authorName: 'System SuperAdmin',
      rating: this.ratingUpdateValue
    };

    this.careersService.addNote(appId, dto).subscribe({
      next: () => {
        this.newNoteContent = '';
        this.toast.success('Evaluation note added');
      },
      error: () => this.toast.error('Failed to add note')
    });
  }
}
