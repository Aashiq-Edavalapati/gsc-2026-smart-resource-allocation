import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/admin`;

  private async getHeaders(): Promise<HttpHeaders> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('No user logged in');
    
    const token = await user.getIdToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async getStats() {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(this.http.get<any>(`${this.baseUrl}/stats`, { headers }));
    return response.data;
  }

  async getPendingOrganizations() {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(this.http.get<any>(`${this.baseUrl}/organizations/pending`, { headers }));
    return response.data;
  }

  async addContactToOrganization(id: string, email: string) {
    const headers = await this.getHeaders();
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/organizations/${id}/add-contact`, { email }, { headers })
    );
    return response.data;
  }
}
