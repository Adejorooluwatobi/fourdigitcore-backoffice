import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SolutionsService, SolutionDiscipline, UpsertSolutionDto } from '../../services/solutions.service';
import { ToastService } from '../../services/toast.service';

@Component({

  selector: 'app-solutions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './solutions.component.html',
  styleUrl: './solutions.component.scss'
})
export class SolutionsComponent implements OnInit {
  private solutionsService = inject(SolutionsService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  public solutions = signal<SolutionDiscipline[]>([]);
  public isLoading = signal(false);
  public isSaving = signal(false);
  public searchQuery = '';
  public selectedCategory = signal<string>('all');
  public viewMode = signal<'grid' | 'list'>('list');

  public isDrawerOpen = signal(false);
  public isEditing = signal(false);
  public editingItem = signal<SolutionDiscipline | null>(null);
  public deletingItem = signal<SolutionDiscipline | null>(null);

  public specsList = signal<string[]>([]);
  public appsList = signal<string[]>([]);
  public newSpecInput = '';
  public newAppInput = '';

  public form = this.fb.group({
    disciplineNumber: ['01', Validators.required],
    categoryName: ['', Validators.required],
    title: ['', Validators.required],
    description: ['', Validators.required],
    ctaText: ['Deploy Module'],
    ctaUrl: ['/contact'],
    sortOrder: [1]
  });

  public categories = computed(() => {
    const list = this.solutions();
    const set = new Set<string>();
    list.forEach(i => {
      if (i.categoryName) set.add(i.categoryName);
    });
    return ['all', ...Array.from(set)];
  });

  public filteredSolutions = computed(() => {
    const list = this.solutions();
    const q = this.searchQuery.toLowerCase().trim();
    const cat = this.selectedCategory();

    return list.filter(item => {
      const matchCat = cat === 'all' || item.categoryName === cat;
      const matchQuery = !q || 
        item.title.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.specs.some(s => s.specText.toLowerCase().includes(q)) ||
        item.applications.some(a => a.applicationName.toLowerCase().includes(q));

      return matchCat && matchQuery;
    });
  });

  ngOnInit(): void {
    this.loadSolutions();
  }

  public loadSolutions(): void {
    this.isLoading.set(true);
    this.solutionsService.getAll().subscribe({
      next: (data) => {
        this.isLoading.set(false);
        this.solutions.set(data || []);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Error', 'Unable to load solution disciplines from backend.');
      }
    });
  }

  public openCreateDrawer(): void {
    this.isEditing.set(false);
    this.editingItem.set(null);
    this.specsList.set([]);
    this.appsList.set([]);
    this.form.reset({
      disciplineNumber: '0' + (this.solutions().length + 1),
      categoryName: 'Core Engineering',
      title: '',
      description: '',
      ctaText: 'Deploy Module',
      ctaUrl: '/contact',
      sortOrder: this.solutions().length + 1
    });
    this.isDrawerOpen.set(true);
  }

  public openEditDrawer(item: SolutionDiscipline): void {
    this.isEditing.set(true);
    this.editingItem.set(item);
    this.specsList.set(item.specs.map(s => s.specText));
    this.appsList.set(item.applications.map(a => a.applicationName));
    this.form.patchValue({
      disciplineNumber: item.disciplineNumber,
      categoryName: item.categoryName,
      title: item.title,
      description: item.description,
      ctaText: item.ctaText,
      ctaUrl: item.ctaUrl,
      sortOrder: item.sortOrder
    });
    this.isDrawerOpen.set(true);
  }

  public closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  public addSpec(): void {
    if (!this.newSpecInput.trim()) return;
    this.specsList.update(list => [...list, this.newSpecInput.trim()]);
    this.newSpecInput = '';
  }

  public removeSpec(idx: number): void {
    this.specsList.update(list => list.filter((_, i) => i !== idx));
  }

  public addApp(): void {
    if (!this.newAppInput.trim()) return;
    this.appsList.update(list => [...list, this.newAppInput.trim()]);
    this.newAppInput = '';
  }

  public removeApp(idx: number): void {
    this.appsList.update(list => list.filter((_, i) => i !== idx));
  }

  public saveSolution(): void {
    if (this.form.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    const val = this.form.value;

    const dto: UpsertSolutionDto = {
      disciplineNumber: val.disciplineNumber!,
      categoryName: val.categoryName!,
      title: val.title!,
      description: val.description!,
      ctaText: val.ctaText || 'Deploy Module',
      ctaUrl: val.ctaUrl || '/contact',
      sortOrder: val.sortOrder || 1,
      specs: this.specsList(),
      applications: this.appsList()
    };

    if (this.isEditing() && this.editingItem()) {
      this.solutionsService.update(this.editingItem()!.id, dto).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.toastService.success('Module Updated', `Updated "${updated.title}" successfully.`);
          this.closeDrawer();
          this.loadSolutions();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toastService.error('Error', err.error?.message || 'Failed to update solution.');
        }
      });
    } else {
      this.solutionsService.create(dto).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.toastService.success('Module Created', `Created "${created.title}" successfully.`);
          this.closeDrawer();
          this.loadSolutions();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toastService.error('Error', err.error?.message || 'Failed to create solution.');
        }
      });
    }
  }

  public confirmDelete(item: SolutionDiscipline): void {
    this.deletingItem.set(item);
  }

  public executeDelete(): void {
    const item = this.deletingItem();
    if (!item) return;

    this.solutionsService.delete(item.id).subscribe({
      next: () => {
        this.deletingItem.set(null);
        this.toastService.success('Module Deleted', `Deleted "${item.title}".`);
        this.loadSolutions();
      },
      error: (err) => {
        this.deletingItem.set(null);
        this.toastService.error('Error', err.error?.message || 'Failed to delete solution.');
      }
    });
  }
}
