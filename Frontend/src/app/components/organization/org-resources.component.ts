import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationDashboardService } from '../../services/organization-dashboard.service';

@Component({
  selector: 'app-org-resources',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-4 border-b pb-4">
        <button 
          (click)="activeTab.set('issues')" 
          [class.border-primary]="activeTab() === 'issues'"
          [class.text-foreground]="activeTab() === 'issues'"
          [class.border-transparent]="activeTab() !== 'issues'"
          [class.text-muted-foreground]="activeTab() !== 'issues'"
          class="pb-2 border-b-2 font-medium text-sm transition-colors hover:text-foreground">
          Suggested Issues ({{ issues().length }})
        </button>
        <button 
          (click)="activeTab.set('tasks')" 
          [class.border-primary]="activeTab() === 'tasks'"
          [class.text-foreground]="activeTab() === 'tasks'"
          [class.border-transparent]="activeTab() !== 'tasks'"
          [class.text-muted-foreground]="activeTab() !== 'tasks'"
          class="pb-2 border-b-2 font-medium text-sm transition-colors hover:text-foreground">
          Suggested Tasks ({{ tasks().length }})
        </button>
      </div>

      <div *ngIf="isLoading" class="p-12 flex justify-center">
        <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>

      <!-- Issues List -->
      <div *ngIf="!isLoading && activeTab() === 'issues'" class="space-y-4 animate-in fade-in">
        <div *ngIf="issues().length === 0" class="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <p>No suggested issues pending review.</p>
        </div>

        <div *ngFor="let issue of issues()" class="rounded-xl border bg-card text-card-foreground shadow-sm p-5 hover:border-primary/50 transition-colors">
          <div class="flex flex-col md:flex-row gap-4 justify-between">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                  {{ issue.category || 'Issue' }}
                </span>
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  [ngClass]="issue.urgency === 'HIGH' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'">
                  {{ issue.urgency || 'NORMAL' }}
                </span>
              </div>
              <h4 class="font-bold text-lg leading-tight">{{ issue.title }}</h4>
              <p class="text-sm text-muted-foreground line-clamp-2 max-w-3xl">{{ issue.description }}</p>
              
              <div class="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-2">
                <div class="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ issue.city || 'Unknown Location' }}
                </div>
                <div class="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Field Report ID: {{ issue.fieldReportId?.substring(0, 8) || 'N/A' }}
                </div>
              </div>
            </div>

            <div class="flex flex-row md:flex-col gap-2 min-w-[120px]">
              <button 
                (click)="approveIssue(issue.id)"
                [disabled]="isProcessing"
                class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-500 text-white hover:bg-emerald-600 h-9 px-4 py-2">
                Approve
              </button>
              <button 
                (click)="rejectIssue(issue.id)"
                [disabled]="isProcessing"
                class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive h-9 px-4 py-2">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks List -->
      <div *ngIf="!isLoading && activeTab() === 'tasks'" class="space-y-4 animate-in fade-in">
        <div *ngIf="tasks().length === 0" class="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <p>No suggested tasks pending review.</p>
        </div>

        <div *ngFor="let task of tasks()" class="rounded-xl border bg-card text-card-foreground shadow-sm p-5 hover:border-primary/50 transition-colors">
          <div class="flex flex-col md:flex-row gap-4 justify-between">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500">
                  {{ task.category || 'Task' }}
                </span>
                <span class="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {{ task.volunteersNeeded || 1 }} Volunteers
                </span>
              </div>
              <h4 class="font-bold text-lg leading-tight">{{ task.title }}</h4>
              <p class="text-sm text-muted-foreground line-clamp-2 max-w-3xl">{{ task.description }}</p>
              
              <div class="flex flex-wrap items-center gap-2 pt-2">
                <span *ngFor="let skill of task.requiredSkills" class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  {{ skill }}
                </span>
              </div>
            </div>

            <div class="flex flex-row md:flex-col gap-2 min-w-[120px]">
              <button 
                (click)="approveTask(task.id)"
                [disabled]="isProcessing"
                class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-500 text-white hover:bg-emerald-600 h-9 px-4 py-2">
                Approve
              </button>
              <button 
                (click)="rejectTask(task.id)"
                [disabled]="isProcessing"
                class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive h-9 px-4 py-2">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class OrgResourcesComponent implements OnInit {
  @Input() orgId!: string;

  private orgService = inject(OrganizationDashboardService);

  activeTab = signal<'issues' | 'tasks'>('issues');
  issues = signal<any[]>([]);
  tasks = signal<any[]>([]);
  isLoading = true;
  isProcessing = false;

  ngOnInit() {
    if (this.orgId) {
      this.loadResources();
    }
  }

  async loadResources() {
    this.isLoading = true;
    try {
      const [issuesData, tasksData] = await Promise.all([
        this.orgService.getSuggestedIssues(this.orgId).catch(() => []),
        this.orgService.getSuggestedTasks(this.orgId).catch(() => [])
      ]);
      
      this.issues.set(issuesData);
      this.tasks.set(tasksData);
    } catch (error) {
      console.error('Error loading resources', error);
    } finally {
      this.isLoading = false;
    }
  }

  async approveIssue(id: string) {
    this.isProcessing = true;
    try {
      await this.orgService.approveIssue(id, this.orgId);
      await this.loadResources();
    } catch (error) {
      console.error('Failed to approve issue', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async rejectIssue(id: string) {
    if (!confirm('Are you sure you want to reject this issue?')) return;
    this.isProcessing = true;
    try {
      await this.orgService.rejectIssue(id, this.orgId);
      await this.loadResources();
    } catch (error) {
      console.error('Failed to reject issue', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async approveTask(id: string) {
    this.isProcessing = true;
    try {
      await this.orgService.approveTask(id, this.orgId);
      await this.loadResources();
    } catch (error) {
      console.error('Failed to approve task', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async rejectTask(id: string) {
    if (!confirm('Are you sure you want to reject this task?')) return;
    this.isProcessing = true;
    try {
      await this.orgService.rejectTask(id, this.orgId);
      await this.loadResources();
    } catch (error) {
      console.error('Failed to reject task', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
