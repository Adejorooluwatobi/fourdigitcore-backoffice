import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TelemetryAuditService, TelemetryNode, AuditLog } from './telemetry-audit.service';

describe('TelemetryAuditService', () => {
  let service: TelemetryAuditService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TelemetryAuditService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created and have empty initial arrays', () => {
    expect(service).toBeTruthy();
    expect(service.nodes()).toEqual([]);
    expect(service.logs()).toEqual([]);
    expect(service.announcements()).toEqual([]);
  });

  it('should load nodes and update nodes signal', () => {
    const mockNodes: TelemetryNode[] = [
      {
        id: 'node-1',
        nodeIdentifier: 'NODE-US-EAST-01',
        region: 'US-EAST',
        enclaveType: 'AmdSevSnp',
        status: 'Online',
        snapshots: [
          {
            id: 'snap-1',
            latencyMs: 0.14,
            tpsThroughput: 148290,
            jitterVariancePct: 0.0,
            convergenceState: '6174_CONVERGED',
            recordedAt: new Date().toISOString()
          }
        ]
      }
    ];

    service.loadNodes().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].nodeIdentifier).toBe('NODE-US-EAST-01');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/admin/telemetry/nodes'));
    expect(req.request.method).toBe('GET');
    req.flush(mockNodes);

    expect(service.nodes().length).toBe(1);
  });

  it('should load audit logs and update logs signal', () => {
    const mockLogs: AuditLog[] = [
      {
        id: 'log-1',
        action: 'UPDATE',
        entityType: 'TELEMETRY_NODE',
        entityId: 'node-1',
        diffPayload: '{"status":"Online"}',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString()
      }
    ];

    service.loadAuditLogs().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].action).toBe('UPDATE');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/admin/audit-logs') && r.params.has('page'));
    expect(req.request.method).toBe('GET');
    req.flush(mockLogs);

    expect(service.logs().length).toBe(1);
  });
});
