import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  PlatformService, 
  PlatformOverview, 
  PlatformPillar, 
  SdkShowcase, 
  SdkSnippet, 
  SdkCategory, 
  HomeHeroSlide 
} from '../../services/platform.service';
import { ToastService } from '../../services/toast.service';
import { MediaService } from '../../services/media.service';
import { ImageUploaderComponent } from '../../shared/image-uploader/image-uploader.component';

@Component({
  selector: 'app-platform',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImageUploaderComponent],
  templateUrl: './platform.component.html',
  styleUrl: './platform.component.scss'
})
export class PlatformComponent implements OnInit {
  public platformService = inject(PlatformService);
  public mediaService = inject(MediaService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  public activeTab = signal<'hero' | 'pillars' | 'quote-callout' | 'sdk'>('hero');
  public isLoading = signal(false);
  public isSaving = signal(false);

  public pillars = signal<PlatformPillar[]>([]);
  public slides = signal<HomeHeroSlide[]>([]);
  public sdkSnippets = signal<SdkSnippet[]>([]);
  public sdkCategories = signal<SdkCategory[]>([]);

  // Hero Form
  public heroForm: FormGroup = this.fb.group({
    badgeText: [''],
    headline: ['', Validators.required],
    subheadline: [''],
    primaryCtaText: [''],
    primaryCtaUrl: [''],
    secondaryCtaText: [''],
    secondaryCtaUrl: [''],
    latencyCeilingValue: [''],
    latencyCeilingLabel: [''],
    stateModelValue: [''],
    stateModelLabel: [''],
    enclaveSecurityValue: [''],
    enclaveSecurityLabel: ['']
  });

  // Quote Form
  public quoteForm: FormGroup = this.fb.group({
    quoteText: ['', Validators.required],
    attribution: [''],
    invariantTerm: ['']
  });

  // Callout Form
  public calloutForm: FormGroup = this.fb.group({
    badgeText: [''],
    title: ['', Validators.required],
    description: [''],
    primaryCtaText: [''],
    primaryCtaUrl: [''],
    secondaryCtaText: [''],
    secondaryCtaUrl: ['']
  });

  // Pillar Drawer State
  public isPillarDrawerOpen = signal(false);
  public editingPillarId: string | null = null;
  public pillarSpecsList: string[] = [];
  public pillarAppsList: string[] = [];
  public newPillarSpecInput = '';
  public newPillarAppInput = '';
  public pillarToDelete: PlatformPillar | null = null;

  public pillarForm: FormGroup = this.fb.group({
    layerNumber: ['01', Validators.required],
    badgeText: ['', Validators.required],
    title: ['', Validators.required],
    description: ['', Validators.required],
    icon: ['hub'],
    sortOrder: [1]
  });

  // Slide Modal State
  public isSlideModalOpen = false;
  public newSlideData = {
    imageUrl: '',
    altText: '',
    sortOrder: 1
  };

  // Snippet Modal State
  public isSnippetModalOpen = signal(false);
  public editingSnippetId = signal<string | null>(null);
  public snippetToDelete: SdkSnippet | null = null;

  public readonly languagePresets = [
    { key: 'rust', name: 'Rust (Kernel Binding)', ext: 'rs', binding: 'immutable kernel binding', pkg: 'CRATE: fourdigitcore-v4.8', mem: 'MEM: < 3.8 MB', threads: 'THREADS: lock-free' },
    { key: 'python', name: 'Python (PyO3 C-Extension)', ext: 'py', binding: 'zero-copy PyO3 bridge', pkg: 'PIP: fourdigitcore', mem: 'MEM: < 12 MB', threads: 'GIL: unlocked worker threads' },
    { key: 'go', name: 'Go (Cgo Low-Latency Client)', ext: 'go', binding: 'ring-buffer IPC channel', pkg: 'GO: github.com/4digitcore/sdk', mem: 'MEM: < 8 MB', threads: 'GOROUTINES: channel multiplex' },
    { key: 'typescript', name: 'TypeScript (V8 SIMD Engine)', ext: 'ts', binding: 'V8 isolate SIMD engine', pkg: 'NPM: @4digitcore/client', mem: 'MEM: < 16 MB', threads: 'EVENT-LOOP: non-blocking IO' },
    { key: 'csharp', name: 'C# / .NET (Native P/Invoke)', ext: 'cs', binding: 'unmanaged pointer invocation', pkg: 'NUGET: FourDigitCore.Client', mem: 'MEM: < 9 MB', threads: 'TASKS: ValueTasks async IO' },
    { key: 'cpp', name: 'C++20 (Header-Only Kernel Client)', ext: 'cpp', binding: 'zero-overhead compile templates', pkg: 'CONAN: fourdigitcore/4.8', mem: 'MEM: < 2 MB', threads: 'PTHREADS: hardware pin' },
    { key: 'zig', name: 'Zig (Comptime Native Binding)', ext: 'zig', binding: 'manual allocators / SIMD vector', pkg: 'ZIG: fourdigitcore.build', mem: 'MEM: < 1.5 MB', threads: 'THREADS: naked os threads' },
    { key: 'swift', name: 'Swift (Server-Side Actors)', ext: 'swift', binding: 'structured async/await actors', pkg: 'SPM: FourDigitCore', mem: 'MEM: < 7 MB', threads: 'ACTORS: co-operative pool' },
    { key: 'kotlin', name: 'Kotlin (Native Coroutines)', ext: 'kt', binding: 'K/Native direct memory model', pkg: 'GRADLE: core.fourdigit:client', mem: 'MEM: < 14 MB', threads: 'DISPATCHERS: virtual threads' },
    { key: 'java', name: 'Java (Panama FFM API)', ext: 'java', binding: 'Foreign Function & Memory API', pkg: 'MAVEN: com.fourdigitcore:sdk', mem: 'MEM: < 22 MB', threads: 'VIRTUAL: Loom fibers' },
    { key: 'bash', name: 'Bash / Shell (CLI Quickstart)', ext: 'sh', binding: 'posix standard pipe streaming', pkg: 'BIN: 4dc-cli v4.8', mem: 'MEM: minimal', threads: 'FORK: subshell pipe' }
  ];

  public snippetForm: FormGroup = this.fb.group({
    languageKey: ['', Validators.required],
    displayName: ['', Validators.required],
    categorySlug: ['systems', Validators.required],
    fileName: ['', Validators.required],
    bindingTag: [''],
    packageTag: [''],
    memoryTag: [''],
    threadsTag: [''],
    sortOrder: [1],
    codeContent: ['', Validators.required]
  });

  // SDK Section Data
  public sdkSectionData = {
    badgeText: '04 // DEVELOPER ECOSYSTEM',
    title: 'Native SDKs for Ultra-Low Latency',
    description: 'Deploy deterministic cluster connections in under 4 lines of code. Zero unneeded runtime abstractions.'
  };

  ngOnInit() {
    this.loadAllData();
  }

  public loadAllData() {
    this.isLoading.set(true);
    this.platformService.getOverview().subscribe({
      next: (data: PlatformOverview) => {
        if (data.hero) {
          this.heroForm.patchValue(data.hero);
        }
        if (data.slides) {
          this.slides.set(data.slides);
        }
        if (data.quote) {
          this.quoteForm.patchValue(data.quote);
        }
        if (data.closingCallout) {
          this.calloutForm.patchValue(data.closingCallout);
        }
        if (data.pillars) {
          this.pillars.set(data.pillars);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load platform CMS data.');
        this.isLoading.set(false);
      }
    });

    this.platformService.getSdkShowcase().subscribe({
      next: (showcase: SdkShowcase) => {
        this.sdkSectionData.badgeText = showcase.badgeText;
        this.sdkSectionData.title = showcase.title;
        this.sdkSectionData.description = showcase.description;
        this.sdkSnippets.set(showcase.snippets || []);
        this.sdkCategories.set(showcase.categories || []);
      },
      error: () => {}
    });
  }

  public saveHero() {
    if (this.heroForm.invalid) return;
    this.isSaving.set(true);
    this.platformService.updateHero(this.heroForm.value).subscribe({
      next: () => {
        this.toast.success('Hero messaging and telemetry HUD updated successfully.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update Hero section.');
        this.isSaving.set(false);
      }
    });
  }

  public saveQuote() {
    if (this.quoteForm.invalid) return;
    this.isSaving.set(true);
    this.platformService.updateQuote(this.quoteForm.value).subscribe({
      next: () => {
        this.toast.success('Quote section updated.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update quote.');
        this.isSaving.set(false);
      }
    });
  }

  public saveCallout() {
    if (this.calloutForm.invalid) return;
    this.isSaving.set(true);
    this.platformService.updateClosingCallout(this.calloutForm.value).subscribe({
      next: () => {
        this.toast.success('Closing callout banner updated.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update closing callout.');
        this.isSaving.set(false);
      }
    });
  }

  public openPillarDrawer(pillar?: PlatformPillar) {
    if (pillar) {
      this.editingPillarId = pillar.id;
      this.pillarForm.patchValue({
        layerNumber: pillar.layerNumber,
        badgeText: pillar.badgeText,
        title: pillar.title,
        description: pillar.description,
        icon: pillar.icon || 'hub',
        sortOrder: pillar.sortOrder || 1
      });
      this.pillarSpecsList = pillar.specs ? pillar.specs.map(s => s.specText) : [];
      this.pillarAppsList = pillar.applications ? pillar.applications.map(a => a.applicationName) : [];
    } else {
      this.editingPillarId = null;
      this.pillarForm.reset({
        layerNumber: `0${this.pillars().length + 1}`,
        badgeText: '',
        title: '',
        description: '',
        icon: 'hub',
        sortOrder: this.pillars().length + 1
      });
      this.pillarSpecsList = [];
      this.pillarAppsList = [];
    }
    this.isPillarDrawerOpen.set(true);
  }

  public closePillarDrawer() {
    this.isPillarDrawerOpen.set(false);
    this.editingPillarId = null;
  }

  public addPillarSpec() {
    if (!this.newPillarSpecInput.trim()) return;
    this.pillarSpecsList.push(this.newPillarSpecInput.trim());
    this.newPillarSpecInput = '';
  }

  public removePillarSpec(idx: number) {
    this.pillarSpecsList.splice(idx, 1);
  }

  public addPillarApp() {
    if (!this.newPillarAppInput.trim()) return;
    this.pillarAppsList.push(this.newPillarAppInput.trim());
    this.newPillarAppInput = '';
  }

  public removePillarApp(idx: number) {
    this.pillarAppsList.splice(idx, 1);
  }

  public savePillar() {
    if (this.pillarForm.invalid) return;
    this.isSaving.set(true);

    const payload = {
      ...this.pillarForm.value,
      specs: this.pillarSpecsList,
      applications: this.pillarAppsList
    };

    if (this.editingPillarId) {
      this.platformService.updatePillar(this.editingPillarId, payload).subscribe({
        next: () => {
          this.toast.success('Architecture pillar updated.');
          this.closePillarDrawer();
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to update pillar.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.platformService.createPillar(payload).subscribe({
        next: () => {
          this.toast.success('New architecture pillar created.');
          this.closePillarDrawer();
          this.loadAllData();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('Failed to create pillar.');
          this.isSaving.set(false);
        }
      });
    }
  }

  public confirmDeletePillar(p: PlatformPillar) {
    this.pillarToDelete = p;
  }

  public executeDeletePillar() {
    if (!this.pillarToDelete) return;
    this.platformService.deletePillar(this.pillarToDelete.id).subscribe({
      next: () => {
        this.toast.success('Pillar removed.');
        this.pillarToDelete = null;
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to delete pillar.');
      }
    });
  }

  // Slides
  public openAddSlideModal() {
    this.newSlideData = {
      imageUrl: '',
      altText: '',
      sortOrder: this.slides().length + 1
    };
    this.isSlideModalOpen = true;
  }

  public saveSlide() {
    if (!this.newSlideData.imageUrl) return;
    this.isSaving.set(true);
    this.platformService.addSlide(this.newSlideData).subscribe({
      next: () => {
        this.toast.success('Slide added to hero gallery.');
        this.isSlideModalOpen = false;
        this.loadAllData();
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to add slide.');
        this.isSaving.set(false);
      }
    });
  }

  public deleteSlide(id: string) {
    this.platformService.deleteSlide(id).subscribe({
      next: () => {
        this.toast.success('Slide removed.');
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to remove slide.');
      }
    });
  }

  // SDK Section
  public saveSdkSection() {
    this.isSaving.set(true);
    this.platformService.updateSdkSection(this.sdkSectionData).subscribe({
      next: () => {
        this.toast.success('SDK showcase section header updated.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Failed to update SDK showcase header.');
        this.isSaving.set(false);
      }
    });
  }

  public openAddSnippetModal() {
    this.editingSnippetId.set(null);
    this.snippetForm.reset({
      languageKey: '',
      displayName: '',
      categorySlug: 'systems',
      fileName: '',
      bindingTag: '',
      packageTag: '',
      memoryTag: '',
      threadsTag: '',
      sortOrder: (this.sdkSnippets().length + 1),
      codeContent: ''
    });
    this.isSnippetModalOpen.set(true);
  }

  public applyLanguagePreset(preset: { key: string, name: string, ext: string, binding: string, pkg: string, mem: string, threads: string }) {
    this.snippetForm.patchValue({
      languageKey: preset.key,
      displayName: preset.name,
      fileName: `cluster_init.${preset.ext}`,
      bindingTag: preset.binding,
      packageTag: preset.pkg,
      memoryTag: preset.mem,
      threadsTag: preset.threads
    });
  }

  public resetToCustomLanguage() {
    this.snippetForm.patchValue({
      languageKey: '',
      displayName: '',
      fileName: '',
      bindingTag: '',
      packageTag: '',
      memoryTag: '',
      threadsTag: ''
    });
  }

  public onLanguageKeyInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = (input?.value || '').trim().toLowerCase();
    if (!val) return;

    const preset = this.languagePresets.find(p => p.key === val);
    if (preset) {
      this.applyLanguagePreset(preset);
      return;
    }

    const currentFile = this.snippetForm.get('fileName')?.value || '';
    if (!currentFile || currentFile.startsWith('cluster_init.')) {
      this.snippetForm.patchValue({ fileName: `cluster_init.${val}` }, { emitEvent: false });
    }
    const currentName = this.snippetForm.get('displayName')?.value || '';
    if (!currentName || currentName.includes('(Client SDK)') || currentName.includes('Binding')) {
      this.snippetForm.patchValue({ displayName: `${val.toUpperCase()} (Client SDK)` }, { emitEvent: false });
    }
  }

  public async pasteCodeFromClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          this.snippetForm.patchValue({ codeContent: text });
          this.toast.success('Pasted from clipboard!');
          return;
        }
      }
      this.toast.info('Clipboard Empty', 'No text found in clipboard. Copy your code and paste directly.');
    } catch {
      this.toast.info('Paste Shortcut', 'Press Ctrl+V (or Cmd+V) directly inside the code editor area.');
    }
  }

  public clearCodeContent() {
    this.snippetForm.patchValue({ codeContent: '' });
  }

  public insertSampleCode() {
    const lang = (this.snippetForm.get('languageKey')?.value || '').trim().toLowerCase() || 'rust';
    let sample = `// FourDigitCore ${lang.toUpperCase()} Client SDK\n`;
    if (lang === 'rust') {
      sample = `use fourdigitcore::prelude::*;\n\n#[tokio::main]\nasync fn main() -> Result<(), CoreError> {\n    let cluster = CoreNode::connect("mesh.6174.network")\n        .with_neural_pipeline(Quantization::FP8)\n        .with_zero_trust(Enclave::Nitro)\n        .await?;\n    Ok(())\n}`;
    } else if (lang === 'python') {
      sample = `import asyncio\nfrom fourdigitcore import Client, NeuralPipeline\n\nasync def main():\n    cluster = await Client.connect(\n        endpoint="mesh.6174.network",\n        pipeline=NeuralPipeline.FP8,\n        zero_trust=True\n    )\n    telemetry = await cluster.get_telemetry()\n    print(f"Latency: {telemetry.latency_us}us")\n\nasyncio.run(main())`;
    } else if (lang === 'go') {
      sample = `package main\n\nimport (\n    "context"\n    "log"\n    "github.com/4digitcore/sdk"\n)\n\nfunc main() {\n    ctx := context.Background()\n    client, err := sdk.Dial(ctx, "mesh.6174.network", sdk.WithZeroTrust())\n    if err != nil {\n        log.Fatal(err)\n    }\n    defer client.Close()\n}`;
    } else if (lang === 'typescript' || lang === 'ts' || lang === 'javascript' || lang === 'js') {
      sample = `import { CoreNode, Quantization } from '@4digitcore/client';\n\nasync function bootstrap() {\n  const cluster = await CoreNode.connect({\n    endpoint: 'mesh.6174.network',\n    quantization: Quantization.FP8,\n    zeroTrust: true\n  });\n  console.log('Cluster connected:', cluster.nodeId);\n}\n\nbootstrap();`;
    } else if (lang === 'csharp' || lang === 'cs') {
      sample = `using FourDigitCore.Client;\n\nawait using var node = await CoreNode.ConnectAsync("mesh.6174.network", new NodeOptions {\n    Quantization = QuantizationMode.FP8,\n    ZeroTrust = true\n});\nvar metrics = await node.GetTelemetryAsync();`;
    } else if (lang === 'zig') {
      sample = `const std = @import("std");\nconst core = @import("fourdigitcore");\n\npub fn main() !void {\n    var gpa = std.heap.GeneralPurposeAllocator(.{}){};\n    const allocator = gpa.allocator();\n    var node = try core.Node.connect(allocator, "mesh.6174.network");\n    defer node.deinit();\n}`;
    } else {
      sample = `// FourDigitCore Native Client for ${lang.toUpperCase()}\n// Paste your production SDK implementation below:\n`;
    }
    this.snippetForm.patchValue({ codeContent: sample });
  }

  public openEditSnippetModal(snip: SdkSnippet) {
    this.editingSnippetId.set(snip.id);
    this.snippetForm.patchValue({
      languageKey: snip.languageKey,
      displayName: snip.displayName,
      categorySlug: snip.categorySlug,
      fileName: snip.fileName,
      bindingTag: snip.bindingTag,
      packageTag: snip.packageTag,
      memoryTag: snip.memoryTag,
      threadsTag: snip.threadsTag,
      sortOrder: snip.sortOrder,
      codeContent: snip.codeContent
    });
    this.isSnippetModalOpen.set(true);
  }

  public saveSnippet() {
    if (this.snippetForm.invalid) {
      this.toast.error('Validation error', 'Please fill in all required snippet fields.');
      return;
    }

    this.isSaving.set(true);
    const formVal = this.snippetForm.value;
    const dto: any = { ...formVal };

    // Resolve CategoryId if available
    if (!dto.categoryId && this.sdkCategories().length > 0) {
      const matched = this.sdkCategories().find(c => c.slug === dto.categorySlug || c.id === dto.categorySlug);
      if (matched) dto.categoryId = matched.id;
    }

    const id = this.editingSnippetId();

    const req$ = id
      ? this.platformService.updateSdkSnippet(id, dto)
      : this.platformService.createSdkSnippet(dto);

    req$.subscribe({
      next: () => {
        this.toast.success(id ? 'Snippet Updated' : 'Snippet Created', 'Language snippet saved to showcase.');
        this.isSnippetModalOpen.set(false);
        this.isSaving.set(false);
        this.loadAllData();
      },
      error: (err) => {
        this.toast.error('Operation Failed', err.error?.message || 'Failed to save code snippet.');
        this.isSaving.set(false);
      }
    });
  }

  public deleteSnippet(id: string) {
    this.platformService.deleteSdkSnippet(id).subscribe({
      next: () => {
        this.toast.success('Snippet removed.');
        this.loadAllData();
      },
      error: () => {
        this.toast.error('Failed to remove snippet.');
      }
    });
  }
}
