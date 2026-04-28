import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationDashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl;

  private async getHeaders(): Promise<HttpHeaders> {
    const user = this.authService.getCurrentUser();

    if (!user) {
      throw new Error('No user logged in');
    }

    const token = await user.getIdToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async listOrganizations(limit = 100) {
    const response = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/organizations`, {
        params: { limit: String(limit) }
      })
    );

    return response.data ?? [];
  }

  async getOrganization(id: string) {
    const response = await firstValueFrom(this.http.get<any>(`${this.baseUrl}/organizations/${id}`));
    return response.data;
  }

  async createOrganization(payload: any) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/organizations`, payload, { headers })
    );
    return response.data;
  }

  async getOrganizationDashboard(id: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/organizations/${id}/dashboard`, { headers })
    );

    return response.data;
  }

  async getOrganizationMembers(id: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/organizations/${id}/members`, { headers })
    );

    return response.data ?? [];
  }

  async updateMemberRole(id: string, userId: string, payload: { baseRole: string; customRoleName?: string; status?: string }) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.patch<any>(`${this.baseUrl}/organizations/${id}/members/${userId}`, payload, { headers })
    );

    return response.data;
  }

  async removeMember(id: string, userId: string) {
    const headers = await this.getHeaders();
    await firstValueFrom(this.http.delete<any>(`${this.baseUrl}/organizations/${id}/members/${userId}`, { headers }));
  }

  async inviteMember(id: string, email: string, role: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/organizations/${id}/invite`, { email, role }, { headers })
    );

    return response.data;
  }

  async initiateVerification(id: string, darpanId: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/organizations/${id}/initiate-verification`, { darpanId }, { headers })
    );

    return response.data;
  }

  async sendOtp(id: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/organizations/${id}/send-otp`, {}, { headers })
    );

    return response;
  }

  async verifyOtp(id: string, otp: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/organizations/${id}/verify-otp`, { otp }, { headers })
    );

    return response.data;
  }

  async getOrgTasks(id: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/tasks/organizations/${id}/tasks`, { headers })
    );

    return response.data ?? [];
  }

  async getSuggestedIssues(id: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/issues/organization/${id}/suggested`, { headers })
    );

    return response.data ?? [];
  }

  async getSuggestedTasks(id: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/tasks/organization/${id}/suggested`, { headers })
    );

    return response.data ?? [];
  }

  async approveIssue(issueId: string, orgId: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/issues/${issueId}/approve`, { orgId }, { headers })
    );

    return response.data;
  }

  async rejectIssue(issueId: string, orgId: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/issues/${issueId}/reject`, { orgId }, { headers })
    );

    return response.data;
  }

  async approveTask(taskId: string, orgId: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/tasks/${taskId}/approve`, { orgId }, { headers })
    );

    return response.data;
  }

  async rejectTask(taskId: string, orgId: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/tasks/${taskId}/reject`, { orgId }, { headers })
    );

    return response.data;
  }
}