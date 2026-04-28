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
      <div class="space-y-4 max-h-[320px] overflow-y-auto pr-2">
        <div 
          *ngFor="let org of pendingOrgs" 
          class="p-4 bg-muted/30 rounded-lg border border-transparent transition-all duration-300">
          
          <div class="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <!-- NGO Info -->
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm border border-border">
                {{ org.name.charAt(0) }}
              </div>
              <div>
                <h4 class="font-semibold text-sm">{{ org.name }}</h4>
                <p class="text-xs text-muted-foreground mt-0.5">Reg: {{ org.registrationNumber || 'N/A' }}</p>
              </div>
            </div>

            <!-- Actions / Contact Info -->
            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              <!-- Documents Badge -->
              <span *ngIf="org.documents?.length" class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ org.documents.length }} Docs
              </span>

              <!-- Action Button -->
              <button 
                *ngIf="selectedOrgId !== org.id"
                (click)="selectOrg(org.id)"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                Add Contact
              </button>
            </div>
          </div>

          <!-- Inline Add Contact Form -->
          <div 
            *ngIf="selectedOrgId === org.id" 
            class="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            
            <form (submit)="submitEmail(org.id)" class="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <input 
                type="email" 
                [(ngModel)]="contactEmail" 
                name="email"
                placeholder="Enter contact email address..." 
                required
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div class="flex items-center gap-2 ml-auto sm:ml-0">
                <button 
                  type="button" 
                  (click)="cancel()"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  [disabled]="isSubmitting || !contactEmail"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2">
                  <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  {{ isSubmitting ? 'Saving...' : 'Verify' }}
                </button>
              </div>
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
  `,
  styles: []
})
export class AdminPendingOrgsComponent {
  @Input() pendingOrgs: any[] = [];
  @Output() verified = new EventEmitter<void>();

  private adminService = inject(AdminService);

  selectedOrgId: string | null = null;
  contactEmail = '';
  isSubmitting = false;
  errorMsg = '';

  selectOrg(id: string) {
    this.selectedOrgId = id;
    this.contactEmail = '';
    this.errorMsg = '';
  }

  cancel() {
    this.selectedOrgId = null;
    this.contactEmail = '';
    this.errorMsg = '';
  }

  async submitEmail(id: string) {
    if (!this.contactEmail) return;
    this.isSubmitting = true;
    this.errorMsg = '';
    
    try {
      await this.adminService.addContactToOrganization(id, this.contactEmail);
      this.verified.emit();
      this.selectedOrgId = null;
      this.contactEmail = '';
    } catch (e: any) {
      this.errorMsg = e.message || 'Failed to add contact';
    } finally {
      this.isSubmitting = false;
    }
  }
}
