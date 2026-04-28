import { Component, OnInit, inject, signal, effect, Input } from '@angular/core';
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
          <!-- Admin/Owner Tabs -->
          <ng-container *ngIf="userRole() === 'ADMIN' || userRole() === 'OWNER'">
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
          </ng-container>

          <button 
            (click)="currentTab.set('resources')" 
            [class.bg-accent]="currentTab() === 'resources'"
            [class.text-accent-foreground]="currentTab() === 'resources'"
            class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Resources & Reports
          </button>

          <!-- Report Upload Tab -->
          <button 
            (click)="currentTab.set('upload')" 
            [class.bg-accent]="currentTab() === 'upload'"
            [class.text-accent-foreground]="currentTab() === 'upload'"
            class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Submit Field Report
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
                    <div *ngIf="orgDashboardData()?.organization?.verificationStatus === 'CONTACT_ADDED'" class="bg-accent/20 border border-border p-4 rounded-xl mt-4 animate-in slide-in-from-bottom-2 duration-300">
                      <label class="block text-sm font-semibold mb-1 text-foreground flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M18 16v6"/><path d="m15 19 3 3 3-3"/></svg>
                        Step 3: Verify Contact Email
                      </label>
                      <p class="text-xs text-muted-foreground mb-4">
                        An admin has linked <strong class="text-foreground">{{ orgDashboardData()?.organization?.verifiedEmail || orgDashboardData()?.organization?.verifiedContactEmail || 'an email' }}</strong> to your Darpan ID.
                      </p>
                      
                      <div class="space-y-3">
                        <div class="flex flex-col gap-1.5">
                          <span class="text-xs font-medium text-muted-foreground">Verification Code</span>
                          <div class="flex items-center gap-2">
                            <input 
                              type="text" 
                              [(ngModel)]="verificationOtp" 
                              name="otp"
                              placeholder="Enter 6-digit OTP" 
                              class="flex h-10 w-full max-w-[220px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono tracking-widest text-center" 
                            />
                            <button 
                              (click)="verifyOtp()" 
                              [disabled]="isVerifying || !verificationOtp" 
                              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 gap-2">
                              <span *ngIf="isVerifying" class="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                              Verify OTP
                            </button>
                          </div>
                        </div>
                        
                        <div class="pt-2 border-t border-border/50 flex items-center justify-between">
                          <span class="text-xs text-muted-foreground">Didn't receive a code?</span>
                          <button 
                            (click)="sendOtp()" 
                            [disabled]="isVerifying" 
                            class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M21 13a9 9 0 1 1-3-7.7L21 8"/></svg>
                            {{ otpSent ? 'Resend OTP' : 'Send OTP' }}
                          </button>
                        </div>
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
            [userRole]="userRole()"
            class="animate-in fade-in duration-500">
          </app-org-resources>

          <!-- Upload Tab -->
          <div *ngIf="currentTab() === 'upload'" class="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div class="p-6 border-b">
                <h3 class="font-semibold tracking-tight text-lg">Submit Field Report</h3>
                <p class="text-sm text-muted-foreground">Upload images, audio, or video. The AI will automatically process the content to generate a report, extract issues, and create tasks.</p>
              </div>
              <div class="p-6 space-y-6">
                
                <div *ngIf="reportSuccessMsg" class="p-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md text-sm font-medium">
                  {{ reportSuccessMsg }}
                </div>
                
                <div *ngIf="reportErrorMsg" class="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium">
                  {{ reportErrorMsg }}
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium">File Upload (Image/Video/Audio)</label>
                  <input type="file" (change)="onFileSelected($event)" accept="image/*,video/*,audio/*" class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                
                <div class="space-y-2">
                  <label class="text-sm font-medium">City</label>
                  <input type="text" [(ngModel)]="reportCity" placeholder="e.g. Mumbai" class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                
                <div class="space-y-2">
                  <label class="text-sm font-medium">Description (Optional Notes)</label>
                  <textarea [(ngModel)]="reportDescription" rows="4" placeholder="Add any manual notes..." class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"></textarea>
                </div>

                <button (click)="submitReport()" [disabled]="isSubmittingReport || !reportFile || !reportCity" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 w-full">
                  <span *ngIf="isSubmittingReport" class="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  {{ isSubmittingReport ? 'Processing via AI Pipeline...' : 'Submit Report' }}
                </button>
              </div>
            </div>
          </div>

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

  @Input() set embeddedOrgId(value: string | null) {
    if (value) {
      this.orgId.set(value);
    }
  }
  orgName = signal<string>('');
  orgDashboardData = signal<any>(null);
  userRole = signal<string>('MEMBER');
  currentTab = signal<'overview' | 'members' | 'resources' | 'upload'>('overview');
  isLoading = signal(true);
  userEmail = signal<string>('');

  // Verification State
  darpanId = '';
  verificationOtp = '';
  isVerifying = false;
  otpSent = false;
  verificationError = '';

  // Field Report State
  reportCity = '';
  reportDescription = '';
  reportFile: File | null = null;
  isSubmittingReport = false;
  reportSuccessMsg = '';
  reportErrorMsg = '';

  constructor() {
    // Reactively monitor profile and evaluate role
    effect(() => {
      const profile = this.authService.userProfile();
      const id = this.orgId();
      if (profile?.memberships && id) {
        const membership = profile.memberships.find((m: any) => m.organizationId === id);
        if (membership) {
          const role = membership.baseRole;
          this.userRole.set(role);
          
          if (role === 'MEMBER') {
            this.currentTab.set('upload');
            this.isLoading.set(false);
          } else {
            this.currentTab.set('overview');
          }
          // If admin/owner, refresh dashboard data
          if (role !== 'MEMBER') {
            this.loadDashboardData(id);
          }
        }
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('orgId');
      if (id) {
        this.orgId.set(id);
      }
    });

    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail.set(user.email || 'Unknown User');
    }
  }

  async loadDashboardData(id: string) {
    if (this.userRole() === 'MEMBER') {
      this.isLoading.set(false);
      return; // Standard members do not need to load the admin dashboard stats
    }

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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.reportFile = file;
    }
  }

  async submitReport() {
    if (!this.reportFile || !this.reportCity || !this.orgId()) return;
    this.isSubmittingReport = true;
    this.reportSuccessMsg = '';
    this.reportErrorMsg = '';

    try {
      const formData = new FormData();
      formData.append('files[]', this.reportFile);
      formData.append('city', this.reportCity);
      formData.append('description', this.reportDescription);
      formData.append('organizationId', this.orgId()!);
      
      // Send some dummy lat/lng as required by backend schema if actual location is unavailable
      formData.append('lat', '28.6139');
      formData.append('lng', '77.2090');

      await this.orgService.submitFieldReport(formData);
      this.reportSuccessMsg = 'Report submitted and processed by AI successfully!';
      this.reportFile = null;
      this.reportCity = '';
      this.reportDescription = '';
      
      // Reset file input visually if needed, though Angular bindings typically handle this
    } catch (error: any) {
      this.reportErrorMsg = error.message || 'Failed to submit field report.';
    } finally {
      this.isSubmittingReport = false;
    }
  }
}
