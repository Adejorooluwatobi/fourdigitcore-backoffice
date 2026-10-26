import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  AboutService, 
  AboutOverview, 
  TeamMember 
} from '../../services/about.service';
import { ToastService } from '../../services/toast.service';
import { MediaService } from '../../services/media.service';
import { ImageUploaderComponent } from '../../shared/image-uploader/image-uploader.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImageUploaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {
  public aboutService = inject(AboutService);
  public mediaService = inject(MediaService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  public activeTab = signal<'narrative' | 'architect' | 'team'>('narrative');
  public isLoading = signal(false);
  public isSaving = signal(false);

  public teamMembers = signal<TeamMember[]>([]);

  // Hero Form
  public heroForm: FormGroup = this.fb.group({
    badgeText: [''],
    headline: ['', Validators.required],
    subheadline: [''],
    heroImageUrl: [''],
    heroHudPill: [''],
    equilibriumText: [''],
    clusterStateText: ['']
  });

  // Story Form
  public storyForm: FormGroup = this.fb.group({
    badgeText: [''],
    title: ['', Validators.required],
    paragraph1: ['', Validators.required],
    paragraph2: ['']
  });

  // Architect Form
  public architectForm: FormGroup = this.fb.group({
    initials: ['VT'],
    fullName: ['', Validators.required],
    roleTitle: ['', Validators.required],
    avatarUrl: [''],
    pgpKey: [''],
    quote: [''],
    commitsCountText: [''],
    patentsCountText: [''],
    releasesCountText: ['']
  });

  // Team Form & Drawer
  public isTeamDrawerOpen = false;
  public editingMemberId: string | null = null;
  public teamForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    roleTitle: ['', Validators.required],
    bio: ['', Validators.required],
    avatarUrl: [''],
    pgpFingerprint: [''],
    sortOrder: [1]
  });

  ngOnInit() {
    this.loadAllData();
  }

  public loadAllData() {
    this.isLoading.set(true);
    this.aboutService.getOverview().subscribe({
      next: (data: AboutOverview) => {
        if (data.hero) {
          this.heroForm.patchValue(data.hero);
        }
        if (data.story) {
          this.storyForm.patchValue(data.story);
        }
        if (data.architect) {
          this.architectForm.patchValue(data.architect);
        }
        if (data.teamMembers) {
          this.teamMembers.set(data.teamMembers);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load about CMS data.');
        this.isLoading.set(false);
      }
    });
  }

  public saveHero() {
    if (this.heroForm.invalid) return;
    this.isSaving.set(true);
    this.aboutService.updateHero(this.heroForm.value).subscribe({
      next: () => {
        this.toast.success('About hero indicators updated.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update about hero.');
        this.isSaving.set(false);
      }
    });
  }

  public saveStory() {
    if (this.storyForm.invalid) return;
    this.isSaving.set(true);
    this.aboutService.updateStory(this.storyForm.value).subscribe({
      next: () => {
        this.toast.success('Story narrative updated.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update story.');
        this.isSaving.set(false);
      }
    });
  }

  public saveArchitect() {
    if (this.architectForm.invalid) return;
    this.isSaving.set(true);
    this.aboutService.updateArchitect(this.architectForm.value).subscribe({
      next: () => {
        this.toast.success('Principal architect dossier updated.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update architect dossier.');
        this.isSaving.set(false);
      }
    });
  }

  // Team
  public openTeamDrawer(m?: TeamMember) {
    if (m) {
      this.editingMemberId = m.id;
      this.teamForm.patchValue({
        fullName: m.fullName,
        roleTitle: m.roleTitle,
        bio: m.bio,
        avatarUrl: m.avatarUrl || '',
        pgpFingerprint: m.pgpFingerprint,
        sortOrder: m.sortOrder || 1
      });
    } else {
      this.editingMemberId = null;
      this.teamForm.reset({
        fullName: '',
        roleTitle: '',
        bio: '',
        avatarUrl: '',
        pgpFingerprint: 'PGP: 6174:____',
        sortOrder: this.teamMembers().length + 1
      });
    }
    this.isTeamDrawerOpen = true;
  }

  public saveTeamMember() {
    if (this.teamForm.invalid) return;
    this.isSaving.set(true);
    const payload = this.teamForm.value;

    if (this.editingMemberId) {
      this.aboutService.updateTeamMember(this.editingMemberId, payload).subscribe({
        next: () => {
          this.toast.success('Fellow updated.');
          this.isTeamDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to update fellow.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.aboutService.createTeamMember(payload).subscribe({
        next: () => {
          this.toast.success('Fellow added.');
          this.isTeamDrawerOpen = false;
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to add fellow.');
          this.isSaving.set(false);
        }
      });
    }
  }

  public deleteTeamMember(id: string) {
    this.aboutService.deleteTeamMember(id).subscribe({
      next: () => {
        this.toast.success('Fellow removed.');
        this.loadAllData();
      }
    });
  }
}
