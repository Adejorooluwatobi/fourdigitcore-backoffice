import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AcademyService, AcademyCohort, StudentApplication, CertificateItem, UpsertCohortDto } from '../../services/academy.service';
import { ToastService } from '../../services/toast.service';

@Component({

  selector: 'app-academy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './academy.component.html',
  styleUrl: './academy.component.scss'
})
export class AcademyComponent implements OnInit {
  private academyService = inject(AcademyService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  public activeTab = signal<'cohorts' | 'applications' | 'certificates'>('cohorts');
  public isLoading = signal(false);
  public searchQuery = '';

  public cohorts = signal<AcademyCohort[]>([]);
  public applications = signal<StudentApplication[]>([]);
  public certificates = signal<CertificateItem[]>([]);

  public isCohortDrawerOpen = signal(false);
  public isEditingCohort = signal(false);
  public editingCohortId: string | null = null;

  public cohortForm = this.fb.group({
    name: ['', Validators.required],
    trackId: ['Quantum Systems', Validators.required],
    startDate: [new Date().toISOString().split('T')[0], Validators.required],
    endDate: [new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], Validators.required],
    applicationDeadline: [new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]],
    maxSeats: [30, [Validators.required, Validators.min(1)]],
    status: ['Enrolling', Validators.required]
  });

  public filteredCohorts = computed(() => {
    const list = this.cohorts();
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q) || c.status.toLowerCase().includes(q));
  });

  public filteredApplications = computed(() => {
    const list = this.applications();
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(a => a.studentName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.status.toLowerCase().includes(q));
  });

  public filteredCertificates = computed(() => {
    const list = this.certificates();
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(c => c.recipientName.toLowerCase().includes(q) || c.certCode.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading.set(true);

    this.academyService.getCohorts().subscribe({
      next: (pub: any) => {
        this.isLoading.set(false);
        this.cohorts.set(pub?.cohorts || [
          {
            id: 'c1',
            trackId: 'Quantum Kernel Systems',
            name: 'Cohort Alpha 2026',
            applicationDeadline: '2026-11-15T00:00:00Z',
            startDate: '2026-12-01T00:00:00Z',
            endDate: '2027-03-01T00:00:00Z',
            maxSeats: 25,
            status: 'Enrolling',
            createdAt: '2026-10-22T00:00:00Z'
          }
        ]);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });

    this.academyService.getStudentApplications().subscribe({
      next: (apps) => {
        this.applications.set(apps || []);
      },
      error: () => {}
    });

    this.academyService.getCertificates().subscribe({
      next: (certs) => {
        this.certificates.set(certs || []);
      },
      error: () => {}
    });
  }

  public openCreateCohortDrawer(): void {
    this.isEditingCohort.set(false);
    this.editingCohortId = null;
    this.cohortForm.reset({
      name: '',
      trackId: 'Quantum Systems',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      applicationDeadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      maxSeats: 30,
      status: 'Enrolling'
    });
    this.isCohortDrawerOpen.set(true);
  }

  public openEditCohortDrawer(cohort: AcademyCohort): void {
    this.isEditingCohort.set(true);
    this.editingCohortId = cohort.id;
    this.cohortForm.patchValue({
      name: cohort.name,
      trackId: cohort.trackId,
      startDate: cohort.startDate ? cohort.startDate.split('T')[0] : '',
      endDate: cohort.endDate ? cohort.endDate.split('T')[0] : '',
      maxSeats: cohort.maxSeats,
      status: cohort.status
    });
    this.isCohortDrawerOpen.set(true);
  }

  public closeCohortDrawer(): void {
    this.isCohortDrawerOpen.set(false);
  }

  public saveCohort(): void {
    if (this.cohortForm.invalid) return;
    const val = this.cohortForm.value;

    const dto: UpsertCohortDto = {
      name: val.name!,
      trackId: val.trackId || '00000000-0000-0000-0000-000000000000',
      startDate: new Date(val.startDate!).toISOString(),
      endDate: new Date(val.endDate!).toISOString(),
      applicationDeadline: new Date(val.applicationDeadline || val.startDate!).toISOString(),
      maxSeats: val.maxSeats || 30,
      status: val.status || 'Enrolling'
    };

    if (this.isEditingCohort() && this.editingCohortId) {
      this.academyService.updateCohort(this.editingCohortId, dto).subscribe({
        next: () => {
          this.toastService.success('Cohort Updated', 'Cohort details updated successfully.');
          this.closeCohortDrawer();
          this.loadData();
        },
        error: (err) => {
          this.toastService.error('Error', err.error?.message || 'Failed to update cohort.');
        }
      });
    } else {
      this.academyService.createCohort(dto).subscribe({
        next: () => {
          this.toastService.success('Cohort Created', 'New academy cohort has been published.');
          this.closeCohortDrawer();
          this.loadData();
        },
        error: (err) => {
          this.toastService.error('Error', err.error?.message || 'Failed to create cohort.');
        }
      });
    }
  }

  public deleteCohort(id: string): void {
    this.academyService.deleteCohort(id).subscribe({
      next: () => {
        this.toastService.success('Cohort Deleted', 'Cohort removed.');
        this.loadData();
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to delete cohort.');
      }
    });
  }

  public onUpdateStatus(appId: string, newStatus: string): void {
    this.academyService.updateAppStatus(appId, newStatus).subscribe({
      next: () => {
        this.toastService.success('Status Updated', `Application marked as ${newStatus}.`);
        this.loadData();
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Status update failed.');
      }
    });
  }
}
