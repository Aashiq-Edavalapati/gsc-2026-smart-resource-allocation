import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-pending-orgs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-3xl p-6 shadow-md shadow-gray-100/50 border border-gray-50">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Pending Verifications</h3>
          <p class="text-xs text-gray-400 font-medium mt-0.5">NGOs waiting for access</p>
        </div>
        <span class="bg-[#68417E]/10 text-[#68417E] font-bold text-xs px-3 py-1.5 rounded-xl">
          {{ pendingOrgs.length }} Pending
        </span>
      </div>

      <!-- Empty State -->
      <div *ngIf="pendingOrgs.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm font-medium">All organizations verified!</span>
      </div>

      <!-- Organizations List -->
      <div class="space-y-4">
        <div 
          *ngFor="let org of pendingOrgs" 
          class="p-4 bg-gray-50/50 hover:bg-[#68417E]/5 rounded-2xl border border-transparent hover:border-[#68417E]/10 transition-all duration-300">
          
          <div class="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <!-- NGO Info -->
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#68417E]/20 to-[#68417E]/5 flex items-center justify-center text-[#68417E] font-bold text-lg border border-[#68417E]/10">
                {{ org.name.charAt(0) }}
              </div>
              <div>
                <h4 class="font-bold text-gray-900 text-sm sm:text-base">{{ org.name }}</h4>
                <p class="text-xs text-gray-400 font-medium mt-0.5">Reg: {{ org.registrationNumber || 'N/A' }}</p>
              </div>
            </div>

            <!-- Actions / Contact Info -->
            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              <!-- Documents Badge -->
              <span *ngIf="org.documents?.length" class="text-xs text-gray-500 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl font-medium shadow-sm flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ org.documents.length }} Docs
              </span>

              <!-- Action Button -->
              <button 
                *ngIf="selectedOrgId !== org.id"
                (click)="selectOrg(org.id)"
                class="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-[#68417E] hover:bg-[#68417E] hover:text-white hover:border-[#68417E] transition-all duration-300 shadow-sm">
                Add Contact
              </button>
            </div>
          </div>

          <!-- Inline Add Contact Form -->
          <div 
            *ngIf="selectedOrgId === org.id" 
            class="mt-4 pt-4 border-t border-gray-100/60 animate-in slide-in-from-top-2 duration-200">
            
            <form (submit)="submitEmail(org.id)" class="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <input 
                type="email" 
                [(ngModel)]="contactEmail" 
                name="email"
                placeholder="Enter contact email address..." 
                required
                class="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#68417E]/40 focus:ring-4 focus:ring-[#68417E]/5 transition-all duration-300"
              />
              <div class="flex items-center gap-2 ml-auto sm:ml-0">
                <button 
                  type="button" 
                  (click)="cancel()"
                  class="px-3.5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold text-sm transition-all duration-300">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  [disabled]="isSubmitting || !contactEmail"
                  class="px-4 py-2.5 rounded-xl bg-[#68417E] text-white font-semibold text-sm hover:bg-[#68417E]/90 disabled:opacity-50 transition-all duration-300 shadow-md shadow-[#68417E]/10 flex items-center gap-2">
                  <span *ngIf="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {{ isSubmitting ? 'Saving...' : 'Verify' }}
                </button>
              </div>
            </form>
            
            <p *ngIf="errorMsg" class="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
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
