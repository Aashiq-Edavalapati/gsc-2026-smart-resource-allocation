import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationDashboardService } from '../../services/organization-dashboard.service';

@Component({
  selector: 'app-org-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Invite Member Card -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div>
          <h3 class="font-semibold tracking-tight text-lg">Invite New Member</h3>
          <p class="text-sm text-muted-foreground mb-4">Send an invitation to join your organization.</p>
        </div>
        
        <form (submit)="inviteMember()" class="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <input 
            type="email" 
            [(ngModel)]="inviteEmail" 
            name="email"
            placeholder="Email address" 
            required
            class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <select 
            [(ngModel)]="inviteRole" 
            name="role"
            class="flex h-10 w-full sm:w-48 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button 
            type="submit" 
            [disabled]="isInviting || !inviteEmail"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 gap-2 whitespace-nowrap">
            <span *ngIf="isInviting" class="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
            {{ isInviting ? 'Sending...' : 'Send Invite' }}
          </button>
        </form>
        <p *ngIf="inviteMessage" class="text-xs mt-3 font-medium" [ngClass]="inviteError ? 'text-destructive' : 'text-emerald-500'">
          {{ inviteMessage }}
        </p>
      </div>

      <!-- Members List -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div class="p-6 border-b flex items-center justify-between">
          <div>
            <h3 class="font-semibold tracking-tight text-lg">Team Members</h3>
            <p class="text-sm text-muted-foreground">Manage roles and access for your team.</p>
          </div>
          <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
            {{ members().length }} Members
          </span>
        </div>

        <div *ngIf="isLoading" class="p-8 flex justify-center">
          <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>

        <div *ngIf="!isLoading && members().length === 0" class="p-8 text-center text-muted-foreground">
          <p>No members found.</p>
        </div>

        <div *ngIf="!isLoading && members().length > 0" class="divide-y">
          <div *ngFor="let member of members()" class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {{ member.user?.name?.charAt(0) || member.user?.email?.charAt(0) || '?' }}
              </div>
              <div>
                <h4 class="font-semibold text-sm">{{ member.user?.name || 'Unnamed User' }}</h4>
                <p class="text-xs text-muted-foreground">{{ member.user?.email }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              <select 
                [ngModel]="member.baseRole"
                (ngModelChange)="updateRole(member.userId, $event)"
                [disabled]="isUpdating === member.userId"
                class="flex h-9 w-full sm:w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>

              <button 
                (click)="removeMember(member.userId)"
                [disabled]="isUpdating === member.userId"
                class="p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            </div>
            
          </div>
        </div>
      </div>

    </div>
  `
})
export class OrgMembersComponent implements OnInit {
  @Input() orgId!: string;

  private orgService = inject(OrganizationDashboardService);

  members = signal<any[]>([]);
  isLoading = true;

  inviteEmail = '';
  inviteRole = 'MEMBER';
  isInviting = false;
  inviteMessage = '';
  inviteError = false;

  isUpdating: string | null = null;

  ngOnInit() {
    if (this.orgId) {
      this.loadMembers();
    }
  }

  async loadMembers() {
    this.isLoading = true;
    try {
      const data = await this.orgService.getOrganizationMembers(this.orgId);
      this.members.set(data);
    } catch (error) {
      console.error('Failed to load members', error);
    } finally {
      this.isLoading = false;
    }
  }

  async inviteMember() {
    if (!this.inviteEmail) return;
    this.isInviting = true;
    this.inviteMessage = '';
    this.inviteError = false;

    try {
      await this.orgService.inviteMember(this.orgId, this.inviteEmail, this.inviteRole);
      this.inviteMessage = 'Invitation sent successfully!';
      this.inviteEmail = '';
    } catch (e: any) {
      this.inviteError = true;
      this.inviteMessage = e.message || 'Failed to send invite.';
    } finally {
      this.isInviting = false;
      setTimeout(() => this.inviteMessage = '', 5000);
    }
  }

  async updateRole(userId: string, newRole: string) {
    this.isUpdating = userId;
    try {
      await this.orgService.updateMemberRole(this.orgId, userId, { baseRole: newRole });
      await this.loadMembers();
    } catch (error) {
      console.error('Failed to update role', error);
    } finally {
      this.isUpdating = null;
    }
  }

  async removeMember(userId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    this.isUpdating = userId;
    try {
      await this.orgService.removeMember(this.orgId, userId);
      await this.loadMembers();
    } catch (error) {
      console.error('Failed to remove member', error);
    } finally {
      this.isUpdating = null;
    }
  }
}
