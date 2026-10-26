import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InquiriesService, ContactInquiry } from './inquiries.service';

describe('InquiriesService', () => {
  let service: InquiriesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(InquiriesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created and have empty initial inquiries', () => {
    expect(service).toBeTruthy();
    expect(service.inquiries()).toEqual([]);
    expect(service.loading()).toBe(false);
  });

  it('should load inquiries and update signals', () => {
    const mockInquiries: ContactInquiry[] = [
      {
        id: 'inq-1',
        fullName: 'Dr. Thorne',
        email: 'thorne@mit.edu',
        organization: 'MIT Enclave Lab',
        scaleCategory: 'Cluster',
        intent: 'Require 6174 Attractor hardware enclave benchmarking',
        scopeConstraints: 'Sub-millisecond SLA',
        status: 'New',
        priority: 'High',
        createdAt: new Date().toISOString(),
        notes: []
      }
    ];

    service.loadInquiries().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].fullName).toBe('Dr. Thorne');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/admin/inquiries') && r.params.has('page'));
    expect(req.request.method).toBe('GET');
    req.flush(mockInquiries);

    expect(service.inquiries().length).toBe(1);
    expect(service.loading()).toBe(false);
  });
});
