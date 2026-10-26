import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CareersService, JobPosting } from './careers.service';

describe('CareersService', () => {
  let service: CareersService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CareersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created and have empty initial signals', () => {
    expect(service).toBeTruthy();
    expect(service.jobs()).toEqual([]);
    expect(service.applications()).toEqual([]);
    expect(service.loading()).toBe(false);
  });

  it('should load jobs and update jobs signal', () => {
    const mockJobs: JobPosting[] = [
      {
        id: '1',
        departmentId: 'dep-1',
        title: 'Staff Rust Kernel Engineer',
        slug: 'staff-rust-kernel-engineer',
        locationType: 'Remote',
        employmentType: 'FullTime',
        experienceLevel: 'Staff',
        description: 'Lead low-level kernel optimizations',
        requirements: 'eBPF, Rust, Linux internals',
        techStackTags: '["Rust","eBPF"]',
        status: 'Published',
        sortOrder: 1
      }
    ];

    service.loadJobs().subscribe((jobs) => {
      expect(jobs.length).toBe(1);
      expect(jobs[0].title).toBe('Staff Rust Kernel Engineer');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/admin/careers/jobs'));
    expect(req.request.method).toBe('GET');
    req.flush(mockJobs);

    expect(service.jobs().length).toBe(1);
    expect(service.loading()).toBe(false);
  });
});
