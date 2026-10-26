import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  InnovationService, 
  InnovationOverview, 
  Whitepaper, 
  Patent, 
  Benchmark,
  ConvergenceSection,
  ConvergenceStep
} from '../../services/innovation.service';
import { ToastService } from '../../services/toast.service';
import { MediaService } from '../../services/media.service';

@Component({
  selector: 'app-innovation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './innovation.component.html',
  styleUrl: './innovation.component.scss'
})
export class InnovationComponent implements OnInit {
  public innovationService = inject(InnovationService);
  public mediaService = inject(MediaService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  public isUploadingDoc = signal(false);

  public activeTab = signal<'whitepapers' | 'patents' | 'benchmarks' | 'hero' | 'convergence'>('whitepapers');
  public isLoading = signal(false);
  public isSaving = signal(false);

  public whitepapers = signal<Whitepaper[]>([]);
  public patents = signal<Patent[]>([]);
  public benchmarks = signal<Benchmark[]>([]);

  // Mathematical Convergence State
  public convergenceSection = signal<ConvergenceSection | null>(null);
  public convergenceSteps = signal<ConvergenceStep[]>([]);
  public isStepModalOpen = signal(false);
  public editingStepId = signal<string | null>(null);
  public stepToDelete = signal<ConvergenceStep | null>(null);

  public convergenceForm: FormGroup = this.fb.group({
    badgeText: [''],
    title: ['', Validators.required],
    description: ['', Validators.required]
  });

  public stepForm: FormGroup = this.fb.group({
    stepNumberText: ['', Validators.required],
    formulaText: ['', Validators.required],
    subFormulaText: [''],
    description: ['', Validators.required],
    isAttractor: [false],
    sortOrder: [0]
  });

  // Whitepaper Drawer & Form
  public isWhitepaperDrawerOpen = false;
  public editingWpId: string | null = null;
  public wpToDelete: Whitepaper | null = null;

  public wpForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    slug: [''],
    version: ['1.0', Validators.required],
    authors: ['Dr. Vance K. Thorne et al.', Validators.required],
    pdfUrl: ['assets/docs/whitepaper-6174.pdf', Validators.required],
    abstract: ['', Validators.required],
    category: [0]
  });

  // Patent Drawer & Form
  public isPatentDrawerOpen = false;
  public editingPatentId: string | null = null;
  public patentToDelete = signal<Patent | null>(null);

  public patentForm: FormGroup = this.fb.group({
    patentNumber: ['', Validators.required],
    title: ['', Validators.required],
    filingDate: [new Date().toISOString().substring(0, 10), Validators.required],
    grantDate: [''],
    status: [1, Validators.required],
    inventors: ['Dr. Vance K. Thorne', Validators.required],
    docUrl: [''],
    abstract: ['', Validators.required]
  });

  // Benchmark Drawer & Form
  public isBenchmarkDrawerOpen = false;
  public editingBenchmarkId: string | null = null;
  public benchmarkToDelete = signal<Benchmark | null>(null);

  public benchmarkForm: FormGroup = this.fb.group({
    subsystem: ['', Validators.required],
    workloadType: ['', Validators.required],
    throughputTps: [1000000, [Validators.required, Validators.min(1)]],
    latencyP50Ms: [0.0005, Validators.required],
    latencyP99Ms: [0.0012, Validators.required],
    invarianceCycles: [7, [Validators.required, Validators.min(1)]],
    reproducibilityRepoUrl: ['']
  });

  // Hero Form
  public heroForm: FormGroup = this.fb.group({
    badgeText: [''],
    headline: ['', Validators.required],
    subheadline: [''],
    labStatusPill: [''],
    dieFabText: [''],
    opticalWaveguideText: [''],
    laneThroughputText: [''],
    attractorStateText: ['']
  });

  ngOnInit() {
    this.loadAllData();
  }

  public loadAllData() {
    this.isLoading.set(true);
    this.innovationService.getOverview().subscribe({
      next: (data: InnovationOverview) => {
        if (data.hero) {
          this.heroForm.patchValue(data.hero);
        }
        if (data.convergence) {
          this.convergenceSection.set(data.convergence);
          this.convergenceForm.patchValue({
            badgeText: data.convergence.badgeText,
            title: data.convergence.title,
            description: data.convergence.description
          });
          if (data.convergence.steps) {
            const sorted = [...data.convergence.steps].sort((a, b) => a.sortOrder - b.sortOrder);
            this.convergenceSteps.set(sorted);
          }
        }
        if (data.whitepapers) {
          this.whitepapers.set(data.whitepapers);
        }
        if (data.patents) {
          this.patents.set(data.patents);
        }
        if (data.benchmarks) {
          this.benchmarks.set(data.benchmarks);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load innovation CMS data.');
        this.isLoading.set(false);
      }
    });
  }

  public saveHero() {
    if (this.heroForm.invalid) return;
    this.isSaving.set(true);
    this.innovationService.updateHero(this.heroForm.value).subscribe({
      next: () => {
        this.toast.success('Photonic indicators updated successfully.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update photonic indicators.');
        this.isSaving.set(false);
      }
    });
  }

  // Whitepaper operations
  public openWhitepaperDrawer(wp?: Whitepaper) {
    if (wp) {
      this.editingWpId = wp.id;
      this.wpForm.patchValue({
        title: wp.title,
        slug: wp.slug,
        version: wp.version,
        authors: wp.authors,
        pdfUrl: wp.pdfUrl,
        abstract: wp.abstract,
        category: wp.category
      });
    } else {
      this.editingWpId = null;
      this.wpForm.reset({
        title: '',
        slug: '',
        version: '1.0',
        authors: 'Dr. Vance K. Thorne et al.',
        pdfUrl: 'assets/docs/whitepaper.pdf',
        abstract: '',
        category: 0
      });
    }
    this.isWhitepaperDrawerOpen = true;
  }

  public uploadPdf(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.toast.error('Format Error', 'Please select a valid PDF file.');
      return;
    }
    this.isUploadingDoc.set(true);
    this.mediaService.upload(file, 'fourdigitcore/whitepapers').subscribe({
      next: (res) => {
        this.isUploadingDoc.set(false);
        if (res.success && res.url) {
          this.wpForm.patchValue({ pdfUrl: res.url });
          this.toast.success('Whitepaper Uploaded', 'PDF uploaded to Cloudinary CDN.');
        } else {
          this.toast.error('Upload Error', res.message || 'Failed to upload document.');
        }
      },
      error: (err) => {
        this.isUploadingDoc.set(false);
        this.toast.error('Upload Error', err.error?.message || 'Server error uploading PDF.');
      }
    });
  }

  public saveWhitepaper() {
    if (this.wpForm.invalid) return;
    this.isSaving.set(true);
    const payload = this.wpForm.value;

    if (this.editingWpId) {
      this.innovationService.updateWhitepaper(this.editingWpId, payload).subscribe({
        next: () => {
          this.toast.success('Whitepaper updated.');
          this.isWhitepaperDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to update whitepaper.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.innovationService.createWhitepaper(payload).subscribe({
        next: () => {
          this.toast.success('Whitepaper published.');
          this.isWhitepaperDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to publish whitepaper.');
          this.isSaving.set(false);
        }
      });
    }
  }

  public confirmDeleteWhitepaper(wp: Whitepaper) {
    this.wpToDelete = wp;
  }

  public executeDeleteWhitepaper() {
    if (!this.wpToDelete) return;
    this.innovationService.deleteWhitepaper(this.wpToDelete.id).subscribe({
      next: () => {
        this.toast.success('Whitepaper removed.');
        this.wpToDelete = null;
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to delete whitepaper.');
      }
    });
  }

  // Patent operations
  public openPatentDrawer(pt?: Patent) {
    if (pt) {
      this.editingPatentId = pt.id;
      this.patentForm.patchValue({
        patentNumber: pt.patentNumber,
        title: pt.title,
        filingDate: pt.filingDate ? pt.filingDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
        grantDate: pt.grantDate ? pt.grantDate.substring(0, 10) : '',
        status: pt.status !== undefined ? Number(pt.status) : 1,
        inventors: pt.inventors || 'Dr. Vance K. Thorne',
        docUrl: pt.docUrl || '',
        abstract: pt.abstract
      });
    } else {
      this.editingPatentId = null;
      this.patentForm.reset({
        patentNumber: '',
        title: '',
        filingDate: new Date().toISOString().substring(0, 10),
        grantDate: '',
        status: 1,
        inventors: 'Dr. Vance K. Thorne',
        docUrl: '',
        abstract: ''
      });
    }
    this.isPatentDrawerOpen = true;
  }

  public uploadPatentDoc(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.toast.error('Format Error', 'Please select a valid PDF file.');
      return;
    }
    this.isUploadingDoc.set(true);
    this.mediaService.upload(file, 'fourdigitcore/patents').subscribe({
      next: (res) => {
        this.isUploadingDoc.set(false);
        if (res.success && res.url) {
          this.patentForm.patchValue({ docUrl: res.url });
          this.toast.success('Patent Document Uploaded', 'PDF uploaded to Cloudinary CDN.');
        } else {
          this.toast.error('Upload Error', res.message || 'Failed to upload document.');
        }
      },
      error: (err) => {
        this.isUploadingDoc.set(false);
        this.toast.error('Upload Error', err.error?.message || 'Server error uploading PDF.');
      }
    });
  }

  public savePatent() {
    if (this.patentForm.invalid) {
      this.toast.error('Please fill in all required patent fields.');
      return;
    }
    this.isSaving.set(true);
    const formVal = this.patentForm.value;
    const payload = {
      patentNumber: formVal.patentNumber,
      title: formVal.title,
      filingDate: formVal.filingDate ? new Date(formVal.filingDate).toISOString() : new Date().toISOString(),
      grantDate: formVal.grantDate ? new Date(formVal.grantDate).toISOString() : null,
      status: Number(formVal.status),
      inventors: formVal.inventors,
      docUrl: formVal.docUrl || null,
      abstract: formVal.abstract
    };

    if (this.editingPatentId) {
      this.innovationService.updatePatent(this.editingPatentId, payload).subscribe({
        next: () => {
          this.toast.success('Patent record updated.');
          this.isPatentDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to update patent.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.innovationService.createPatent(payload).subscribe({
        next: () => {
          this.toast.success('Patent recorded in portfolio.');
          this.isPatentDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to record patent.');
          this.isSaving.set(false);
        }
      });
    }
  }

  public confirmDeletePatent(pt: Patent) {
    this.patentToDelete.set(pt);
  }

  public executeDeletePatent() {
    const pt = this.patentToDelete();
    if (!pt) return;
    this.innovationService.deletePatent(pt.id).subscribe({
      next: () => {
        this.toast.success('Patent deleted from portfolio.');
        this.patentToDelete.set(null);
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to delete patent.');
      }
    });
  }

  public getPatentStatusLabel(status: any): string {
    if (status === 0 || status === '0' || status === 'Pending') return 'Pending';
    if (status === 1 || status === '1' || status === 'Granted') return 'Granted';
    if (status === 2 || status === '2' || status === 'Published') return 'Published';
    return String(status);
  }

  // Benchmark operations
  public openBenchmarkDrawer(b?: Benchmark) {
    if (b) {
      this.editingBenchmarkId = b.id;
      this.benchmarkForm.patchValue({
        subsystem: b.subsystem,
        workloadType: b.workloadType,
        throughputTps: b.throughputTps,
        latencyP50Ms: b.latencyP50Ms,
        latencyP99Ms: b.latencyP99Ms,
        invarianceCycles: b.invarianceCycles,
        reproducibilityRepoUrl: b.reproducibilityRepoUrl || ''
      });
    } else {
      this.editingBenchmarkId = null;
      this.benchmarkForm.reset({
        subsystem: '',
        workloadType: '',
        throughputTps: 1000000,
        latencyP50Ms: 0.0005,
        latencyP99Ms: 0.0012,
        invarianceCycles: 7,
        reproducibilityRepoUrl: ''
      });
    }
    this.isBenchmarkDrawerOpen = true;
  }

  public saveBenchmark() {
    if (this.benchmarkForm.invalid) {
      this.toast.error('Please fill in all required benchmark fields.');
      return;
    }
    this.isSaving.set(true);
    const formVal = this.benchmarkForm.value;
    const payload = {
      subsystem: formVal.subsystem,
      workloadType: formVal.workloadType,
      throughputTps: Number(formVal.throughputTps),
      latencyP50Ms: Number(formVal.latencyP50Ms),
      latencyP99Ms: Number(formVal.latencyP99Ms),
      invarianceCycles: Number(formVal.invarianceCycles),
      reproducibilityRepoUrl: formVal.reproducibilityRepoUrl || null
    };

    if (this.editingBenchmarkId) {
      this.innovationService.updateBenchmark(this.editingBenchmarkId, payload).subscribe({
        next: () => {
          this.toast.success('Benchmark record updated.');
          this.isBenchmarkDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to update benchmark.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.innovationService.createBenchmark(payload).subscribe({
        next: () => {
          this.toast.success('Benchmark registered.');
          this.isBenchmarkDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to register benchmark.');
          this.isSaving.set(false);
        }
      });
    }
  }

  public confirmDeleteBenchmark(b: Benchmark) {
    this.benchmarkToDelete.set(b);
  }

  public executeDeleteBenchmark() {
    const b = this.benchmarkToDelete();
    if (!b) return;
    this.innovationService.deleteBenchmark(b.id).subscribe({
      next: () => {
        this.toast.success('Benchmark removed.');
        this.benchmarkToDelete.set(null);
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to delete benchmark.');
      }
    });
  }

  // --- Convergence Section & Step Proofs Handlers ---

  public saveConvergenceSection() {
    if (this.convergenceForm.invalid) return;
    this.isSaving.set(true);
    this.innovationService.updateConvergence(this.convergenceForm.value).subscribe({
      next: () => {
        this.toast.success('Convergence proof section updated.');
        this.isSaving.set(false);
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to update convergence proof section.');
        this.isSaving.set(false);
      }
    });
  }

  public openStepModal(step?: ConvergenceStep) {
    if (step) {
      this.editingStepId.set(step.id);
      this.stepForm.patchValue({
        stepNumberText: step.stepNumberText,
        formulaText: step.formulaText,
        subFormulaText: step.subFormulaText || '',
        description: step.description,
        isAttractor: step.isAttractor,
        sortOrder: step.sortOrder
      });
    } else {
      this.editingStepId.set(null);
      const nextSort = this.convergenceSteps().length + 1;
      this.stepForm.reset({
        stepNumberText: `TRANSFORMATION ${nextSort.toString().padStart(2, '0')}`,
        formulaText: '',
        subFormulaText: '',
        description: '',
        isAttractor: false,
        sortOrder: nextSort
      });
    }
    this.isStepModalOpen.set(true);
  }

  public closeStepModal() {
    this.isStepModalOpen.set(false);
    this.editingStepId.set(null);
  }

  public saveStep() {
    if (this.stepForm.invalid) {
      this.toast.error('Please complete all required fields.');
      return;
    }

    this.isSaving.set(true);
    const formVal = this.stepForm.value;
    const payload = {
      stepNumberText: formVal.stepNumberText,
      formulaText: formVal.formulaText,
      subFormulaText: formVal.subFormulaText || null,
      description: formVal.description,
      isAttractor: !!formVal.isAttractor,
      sortOrder: Number(formVal.sortOrder)
    };

    const editId = this.editingStepId();
    if (editId) {
      this.innovationService.updateConvergenceStep(editId, payload).subscribe({
        next: () => {
          this.toast.success('Convergence step updated.');
          this.closeStepModal();
          this.isSaving.set(false);
          this.loadAllData();
        },
        error: () => {
          this.toast.error('Failed to update convergence step.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.innovationService.createConvergenceStep(payload).subscribe({
        next: () => {
          this.toast.success('Convergence step created.');
          this.closeStepModal();
          this.isSaving.set(false);
          this.loadAllData();
        },
        error: () => {
          this.toast.error('Failed to create convergence step.');
          this.isSaving.set(false);
        }
      });
    }
  }

  public confirmDeleteStep(step: ConvergenceStep) {
    this.stepToDelete.set(step);
  }

  public executeDeleteStep() {
    const step = this.stepToDelete();
    if (!step) return;

    this.innovationService.deleteConvergenceStep(step.id).subscribe({
      next: () => {
        this.toast.success('Convergence step removed.');
        this.stepToDelete.set(null);
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to delete convergence step.');
      }
    });
  }
}
