import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-pending-orgs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">

      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold tracking-tight">Pending Verifications</h3>
          <p class="text-sm text-muted-foreground mt-1">NGOs waiting for access</p>
        </div>
        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
          {{ pendingOrgs.length }} Pending
        </span>
      </div>

      <!-- Empty State -->
      <div *ngIf="pendingOrgs.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm font-medium">All organizations verified!</span>
      </div>

      <!-- Organizations List -->
      <div class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        <div 
          *ngFor="let org of pendingOrgs" 
          class="p-4 bg-muted/30 rounded-lg border border-transparent transition-all duration-300">
          
          <div class="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" (click)="toggleExpand(org.id)">
            <!-- NGO Info -->
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm border border-border">
                {{ org.name.charAt(0) }}
              </div>
              <div>
                <h4 class="font-semibold text-sm">{{ org.name }}</h4>
                <div class="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  <span>Darpan ID: {{ org.darpanId || 'N/A' }}</span>
                  <button 
                    *ngIf="org.darpanId"
                    (click)="$event.stopPropagation(); copyDarpanId(org.darpanId)"
                    class="inline-flex items-center justify-center rounded border border-input bg-background px-1.5 py-0.5 text-[10px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    {{ copiedId === org.darpanId ? 'Copied!' : 'Copy' }}
                  </button>
                  <span>• {{ org.city || 'Location unknown' }}</span>
                </div>
              </div>
            </div>

            <!-- Actions / Contact Info -->
            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span *ngIf="org.documents?.length" class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ org.documents.length }} Docs
              </span>
              <button class="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <svg *ngIf="expandedOrgId !== org.id" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                <svg *ngIf="expandedOrgId === org.id" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              </button>
            </div>
          </div>

          <!-- Expanded Details Section -->
          <div *ngIf="expandedOrgId === org.id" class="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200 px-2">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</h5>
                <p class="text-sm">{{ org.description || 'No description provided.' }}</p>
              </div>
              <div>
                <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Organization Type</h5>
                <p class="text-sm">{{ org.type || 'N/A' }}</p>

                <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 mt-3">Darpan ID</h5>
                <div class="flex items-center gap-2 mt-1">
                  <code class="text-sm font-mono bg-muted px-2.5 py-1 rounded border border-border">{{ org.darpanId || 'N/A' }}</code>
                  <button 
                    *ngIf="org.darpanId"
                    (click)="copyDarpanId(org.darpanId)"
                    class="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-2 gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    {{ copiedId === org.darpanId ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
                
                <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 mt-3">Verified Contact</h5>
                <p class="text-sm font-mono bg-muted inline-block px-2 py-0.5 rounded">{{ org.verifiedEmail || org.verifiedContactEmail || 'None' }}</p>
              </div>
            </div>

            <!-- Add Contact Section -->
            <div class="bg-card border rounded-lg p-4 shadow-sm">
              <h5 class="text-sm font-semibold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Assign Verified Contact
              </h5>
              <p class="text-xs text-muted-foreground mb-3">Adding an email will send an OTP for them to verify their Darpan ID.</p>
              
              <form (submit)="submitEmail(org.id)" class="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <input 
                  type="email" 
                  [(ngModel)]="contactEmail" 
                  name="email"
                  placeholder="Enter contact email address..." 
                  required
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button 
                  type="submit" 
                  [disabled]="isSubmitting || !contactEmail"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2 whitespace-nowrap">
                  <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  {{ isSubmitting ? 'Saving...' : 'Send Verification' }}
                </button>
              </form>
              
              <p *ngIf="errorMsg" class="text-xs text-destructive mt-2 font-medium flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errorMsg }}
              </p>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminPendingOrgsComponent {
  @Input() pendingOrgs: any[] = [];
  @Output() verified = new EventEmitter<void>();

  private adminService = inject(AdminService);

  expandedOrgId: string | null = null;
  contactEmail = '';
  isSubmitting = false;
  errorMsg = '';
  copiedId = '';

  copyDarpanId(id: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
    }
    this.copiedId = id;
    setTimeout(() => {
      if (this.copiedId === id) {
        this.copiedId = '';
      }
    }, 2000);
  }

  toggleExpand(id: string) {
    if (this.expandedOrgId === id) {
      this.expandedOrgId = null;
    } else {
      this.expandedOrgId = id;
      this.contactEmail = '';
      this.errorMsg = '';
    }
  }

  async submitEmail(id: string) {
    if (!this.contactEmail) return;
    this.isSubmitting = true;
    this.errorMsg = '';
    
    try {
      await this.adminService.addContactToOrganization(id, this.contactEmail);
      this.verified.emit();
      this.expandedOrgId = null;
      this.contactEmail = '';
    } catch (e: any) {
      this.errorMsg = e.message || 'Failed to add contact';
    } finally {
      this.isSubmitting = false;
    }
  }
}
