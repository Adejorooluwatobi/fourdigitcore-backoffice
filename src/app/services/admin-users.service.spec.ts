import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminUsersService, SystemAdminDetailDto, AdminInvitationDto } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AdminUsersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created and have empty initial admins', () => {
    expect(service).toBeTruthy();
    expect(service.admins()).toEqual([]);
    expect(service.invitations()).toEqual([]);
  });

  it('should load admins and update signals', () => {
    const mockAdmins: SystemAdminDetailDto[] = [
      {
        id: 'usr-1',
        email: 'superadmin@6174core.internal',
        fullName: 'System SuperAdmin',
        isActive: true,
        isSuperAdmin: true,
        roles: ['SUPERADMIN'],
        createdAt: new Date().toISOString()
      }
    ];

    service.loadAdmins().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].email).toBe('superadmin@6174core.internal');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/admin/users'));
    expect(req.request.method).toBe('GET');
    req.flush(mockAdmins);

    expect(service.admins().length).toBe(1);
  });

  it('should load invitations and update signals', () => {
    const mockInvitations: AdminInvitationDto[] = [
      {
        id: 'inv-1',
        email: 'invited@6174core.internal',
        fullName: 'Dr. Jane Vance',
        assignedRole: 'Admin',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        isAccepted: false,
        isRevoked: false,
        isExpired: false,
        invitedByAdminName: 'System SuperAdmin',
        createdAt: new Date().toISOString()
      }
    ];

    service.loadInvitations().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].fullName).toBe('Dr. Jane Vance');
    });

    const req = httpTesting.expectOne((r) => r.url.endsWith('/admin/users/invitations'));
    expect(req.request.method).toBe('GET');
    req.flush(mockInvitations);

    expect(service.invitations().length).toBe(1);
  });
});
