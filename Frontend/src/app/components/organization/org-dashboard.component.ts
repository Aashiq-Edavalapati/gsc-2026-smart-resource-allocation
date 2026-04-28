import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationDashboardService } from '../../services/organization-dashboard.service';
import { AuthService } from '../../services/auth.service';

import { OrgMembersComponent } from './org-members.component';
import { OrgResourcesComponent } from './org-resources.component';

@Component({
  selector: 'app-org-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, OrgMembersComponent, OrgResourcesComponent],
  template: `
    <div class="flex h-screen w-screen bg-background font-sans overflow-hidden">
      <!-- Sidebar -->
      <div class="flex-none h-full w-64 border-r bg-card/50 hidden md:flex flex-col">
        <div class="p-6 border-b">
          <h2 class="text-xl font-bold tracking-tight truncate">{{ orgName() || 'Organization' }}</h2>
          <p class="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
        </div>
        <div class="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <button 
            (click)="currentTab.set('overview')" 
            [class.bg-accent]="currentTab() === 'overview'"
            [class.text-accent-foreground]="currentTab() === 'overview'"
            class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Overview
          </button>
          <button 
            (click)="currentTab.set('members')" 
            [class.bg-accent]="currentTab() === 'members'"
            [class.text-accent-foreground]="currentTab() === 'members'"
            class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Members
          </button>
          <button 
            (click)="currentTab.set('resources')" 
            [class.bg-accent]="currentTab() === 'resources'"
            [class.text-accent-foreground]="currentTab() === 'resources'"
            class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Resources & Reports
          </button>
        </div>
        <div class="p-4 border-t">
          <button (click)="logout()" class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <!-- Header -->
        <header class="h-16 flex items-center justify-between px-6 border-b bg-card">
          <h1 class="text-xl font-bold tracking-tight capitalize">{{ currentTab() }}</h1>
          
          <div class="flex items-center gap-4">
            <div *ngIf="isLoading()" class="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <div class="text-sm font-medium hidden sm:block">{{ userEmail() }}</div>
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {{ (userEmail()?.charAt(0) || 'U') | uppercase }}
            </div>
          </div>
        </header>

        <!-- Dynamic Content Area -->
        <div class="flex-1 overflow-y-auto p-6 bg-background min-h-0">
          
          <div *ngIf="isLoading() && !orgDashboardData()" class="flex flex-col items-center justify-center h-64">
            <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p class="text-muted-foreground text-sm font-medium">Loading organization data...</p>
          </div>

          <!-- Overview Tab -->
          <div *ngIf="currentTab() === 'overview' && orgDashboardData()" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <!-- Verification Workflow -->
            <div *ngIf="orgDashboardData()?.organization?.verificationStatus !== 'VERIFIED'" class="rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-sm p-6 mb-6">
              <div class="flex items-start gap-4">
                <div class="p-2 bg-amber-500/10 rounded-lg text-amber-500 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-amber-600 dark:text-amber-500 mb-1">Organization Not Verified</h3>
                  <p class="text-sm text-muted-foreground mb-4">Complete the verification process to get full access to the platform and build trust with volunteers.</p>
                  
                  <div class="bg-background border rounded-lg p-4 space-y-4">
                    
                    <!-- Step 1: Darpan ID -->
                    <div *ngIf="orgDashboardData()?.organization?.verificationStatus === 'UNVERIFIED'">
                      <label class="block text-sm font-medium mb-1">Step 1: Enter NGO Darpan ID</label>
                      <div class="flex gap-2">
                        <input type="text" [(ngModel)]="darpanId" placeholder="E.g. UP/2021/..." class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                        <button (click)="initiateVerification()" [disabled]="isVerifying || !darpanId" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4">
                          <span *ngIf="isVerifying" class="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                          Submit
                        </button>
                      </div>
                    </div>

                    <!-- Step 2: Waiting for Admin Contact -->
                    <div *ngIf="orgDashboardData()?.organization?.verificationStatus === 'PENDING'">
                      <p class="text-sm font-medium text-amber-600">Step 2: Platform admins are reviewing your Darpan ID.</p>
                      <p class="text-xs text-muted-foreground mt-1">Please wait until a verified contact email is attached to your organization.</p>
                      <button (click)="loadDashboardData(orgId()!)" class="mt-3 inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border bg-background hover:bg-accent h-8 px-3">
                        Check Status
                      </button>
                    </div>

                    <!-- Step 3: OTP Verification -->
                    <div *ngIf="orgDashboardData()?.organization?.verificationStatus === 'CONTACT_ADDED'">
                      <label class="block text-sm font-medium mb-1">Step 3: Verify Contact Email</label>
                      <p class="text-xs text-muted-foreground mb-3">An admin has linked <strong>{{ orgDashboardData()?.organization?.verifiedContactEmail || 'an email' }}</strong> to your Darpan ID.</p>
                      
                      <div *ngIf="!otpSent" class="mb-2">
                        <button (click)="sendOtp()" [disabled]="isVerifying" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-primary text-primary hover:bg-primary/10 h-9 px-4">
                          Send Verification OTP
                        </button>
                      </div>

                      <div *ngIf="otpSent" class="flex gap-2">
                        <input type="text" [(ngModel)]="verificationOtp" placeholder="Enter 6-digit OTP" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                        <button (click)="verifyOtp()" [disabled]="isVerifying || !verificationOtp" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4">
                          <span *ngIf="isVerifying" class="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                          Verify
                        </button>
                      </div>
                    </div>
                    
                    <p *ngIf="verificationError" class="text-xs text-destructive font-medium mt-2">{{ verificationError }}</p>

                  </div>
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h3 class="text-2xl font-bold">{{ orgDashboardData().stats?.totalMembers || 0 }}</h3>
                  <p class="text-sm text-muted-foreground font-medium">Total Members</p>
                </div>
              </div>
              <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <h3 class="text-2xl font-bold">{{ orgDashboardData().stats?.activeIssues || 0 }}</h3>
                  <p class="text-sm text-muted-foreground font-medium">Active Issues</p>
                </div>
              </div>
              <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                  <h3 class="text-2xl font-bold">{{ orgDashboardData().stats?.completedTasks || 0 }}</h3>
                  <p class="text-sm text-muted-foreground font-medium">Completed Tasks</p>
                </div>
              </div>
            </div>

            <!-- Org Profile Overview -->
            <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div class="p-6 border-b">
                <h3 class="font-semibold tracking-tight text-lg">Organization Profile</h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</h5>
                    <p class="text-sm leading-relaxed">{{ orgDashboardData()?.organization?.description || 'No description available' }}</p>
                  </div>
                  <div class="space-y-4">
                    <div>
                      <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Registration</h5>
                      <p class="text-sm">{{ orgDashboardData()?.organization?.registrationNumber || orgDashboardData()?.organization?.darpanId || 'Pending' }}</p>
                    </div>
                    <div>
                      <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</h5>
                      <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20': orgDashboardData()?.organization?.verificationStatus === 'VERIFIED',
                          'bg-amber-500/10 text-amber-500 border-amber-500/20': orgDashboardData()?.organization?.verificationStatus !== 'VERIFIED'
                        }">
                        {{ orgDashboardData()?.organization?.verificationStatus || 'UNVERIFIED' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Members Tab -->
          <app-org-members 
            *ngIf="currentTab() === 'members' && orgId()" 
            [orgId]="orgId()!" 
            class="animate-in fade-in duration-500">
          </app-org-members>

          <!-- Resources Tab -->
          <app-org-resources 
            *ngIf="currentTab() === 'resources' && orgId()" 
            [orgId]="orgId()!" 
            class="animate-in fade-in duration-500">
          </app-org-resources>

        </div>
      </div>
    </div>
  `
})
export class OrgDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationDashboardService);
  private authService = inject(AuthService);

  orgId = signal<string | null>(null);
  orgName = signal<string>('');
  orgDashboardData = signal<any>(null);
  currentTab = signal<'overview' | 'members' | 'resources'>('overview');
  isLoading = signal(true);
  userEmail = signal<string>('');

  // Verification State
  darpanId = '';
  verificationOtp = '';
  isVerifying = false;
  otpSent = false;
  verificationError = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('orgId');
      if (id) {
        this.orgId.set(id);
        this.loadDashboardData(id);
      }
    });

    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail.set(user.email || 'Unknown User');
    }
  }

  async loadDashboardData(id: string) {
    this.isLoading.set(true);
    try {
      const data = await this.orgService.getOrganizationDashboard(id);
      this.orgDashboardData.set(data);
      this.orgName.set(data?.organization?.name || 'Organization Dashboard');
    } catch (error) {
      console.error('Error loading org dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async initiateVerification() {
    if (!this.orgId() || !this.darpanId) return;
    this.isVerifying = true;
    this.verificationError = '';
    
    try {
      await this.orgService.initiateVerification(this.orgId()!, this.darpanId);
      await this.loadDashboardData(this.orgId()!);
    } catch (error: any) {
      this.verificationError = error.message || 'Failed to initiate verification.';
    } finally {
      this.isVerifying = false;
    }
  }

  async sendOtp() {
    if (!this.orgId()) return;
    this.isVerifying = true;
    this.verificationError = '';
    
    try {
      await this.orgService.sendOtp(this.orgId()!);
      this.otpSent = true;
    } catch (error: any) {
      this.verificationError = error.message || 'Failed to send OTP.';
    } finally {
      this.isVerifying = false;
    }
  }

  async verifyOtp() {
    if (!this.orgId() || !this.verificationOtp) return;
    this.isVerifying = true;
    this.verificationError = '';
    
    try {
      await this.orgService.verifyOtp(this.orgId()!, this.verificationOtp);
      await this.loadDashboardData(this.orgId()!);
      this.otpSent = false;
    } catch (error: any) {
      this.verificationError = error.message || 'Failed to verify OTP.';
    } finally {
      this.isVerifying = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
