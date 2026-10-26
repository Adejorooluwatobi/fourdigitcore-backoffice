import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  AdminUsersService, 
  SystemAdminDetailDto, 
  AdminInvitationDto, 
  InviteAdminDto 
} from '../../services/admin-users.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({

  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private adminUsersService = inject(AdminUsersService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  loading = this.adminUsersService.loading;
  admins = this.adminUsersService.admins;
  invitations = this.adminUsersService.invitations;

  activeTab = signal<'operators' | 'invitations'>('operators');
  searchAdminQuery = '';

  isInviteModalOpen = signal<boolean>(false);
  adminToSuspend = signal<SystemAdminDetailDto | null>(null);
  adminToDelete = signal<SystemAdminDetailDto | null>(null);

  inviteForm: InviteAdminDto = {
    fullName: '',
    email: '',
    assignedRole: 'Admin'
  };

  pendingInvitationsCount = computed(() => {
    return this.invitations().filter(i => !i.isAccepted && !i.isRevoked && !i.isExpired).length;
  });

  filteredAdmins = computed(() => {
    let result = this.admins();
    if (this.searchAdminQuery.trim()) {
      const q = this.searchAdminQuery.toLowerCase();
      result = result.filter(a => 
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.roles.some(r => r.toLowerCase().includes(q))
      );
    }
    return result;
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.adminUsersService.loadAdmins().subscribe({
      error: () => this.toast.error('Failed to load administrator directory')
    });
    this.adminUsersService.loadInvitations().subscribe({
      error: () => this.toast.error('Failed to load invitations')
    });
  }

  isCurrentUser(email: string): boolean {
    return this.authService.currentUser()?.email.toLowerCase() === email.toLowerCase();
  }

  getInitials(name: string): string {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  openInviteModal() {
    this.inviteForm = {
      fullName: '',
      email: '',
      assignedRole: 'Admin'
    };
    this.isInviteModalOpen.set(true);
  }

  closeInviteModal() {
    this.isInviteModalOpen.set(false);
  }

  executeInvite() {
    if (!this.inviteForm.fullName.trim() || !this.inviteForm.email.trim()) {
      this.toast.error('Name and Email are required.');
      return;
    }

    this.adminUsersService.inviteAdmin(this.inviteForm).subscribe({
      next: () => {
        this.toast.success(`Invitation dispatched to ${this.inviteForm.email}`);
        this.closeInviteModal();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to send invitation';
        this.toast.error(msg);
      }
    });
  }

  resendInvitation(id: string) {
    this.adminUsersService.resendInvitation(id).subscribe({
      next: () => this.toast.success('Invitation resent with extended expiration'),
      error: (err) => this.toast.error(err.error?.message || 'Failed to resend invitation')
    });
  }

  revokeInvitation(id: string) {
    this.adminUsersService.revokeInvitation(id).subscribe({
      next: () => this.toast.success('Invitation revoked'),
      error: (err) => this.toast.error(err.error?.message || 'Failed to revoke invitation')
    });
  }

  confirmSuspend(admin: SystemAdminDetailDto) {
    this.adminToSuspend.set(admin);
  }

  executeSuspend() {
    const admin = this.adminToSuspend();
    if (!admin) return;

    this.adminUsersService.suspendAdmin(admin.id).subscribe({
      next: () => {
        this.toast.success(`Administrator ${admin.fullName} suspended`);
        this.adminToSuspend.set(null);
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to suspend administrator')
    });
  }

  executeReactivate(admin: SystemAdminDetailDto) {
    this.adminUsersService.reactivateAdmin(admin.id).subscribe({
      next: () => this.toast.success(`Administrator ${admin.fullName} reactivated`),
      error: (err) => this.toast.error(err.error?.message || 'Failed to reactivate administrator')
    });
  }

  confirmDelete(admin: SystemAdminDetailDto) {
    this.adminToDelete.set(admin);
  }

  executeDelete() {
    const admin = this.adminToDelete();
    if (!admin) return;

    this.adminUsersService.deleteAdmin(admin.id).subscribe({
      next: () => {
        this.toast.success(`Administrator ${admin.fullName} permanently deleted`);
        this.adminToDelete.set(null);
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete administrator')
    });
  }
}
