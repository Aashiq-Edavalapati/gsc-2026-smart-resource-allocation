import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MapPlaceholderComponent } from './map-placeholder.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MapPlaceholderComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <!-- Navbar -->
      <nav class="bg-blue-600 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold">GSC Smart Resource Allocation</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm">{{ userEmail }}</span>
            <button
              (click)="logout()"
              class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Welcome! 👋</h2>
          <p class="text-gray-600 text-lg mb-6">You're successfully logged in.</p>
          
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8">
            <h3 class="font-bold text-blue-900 mb-2">Firebase + Backend Auth Working! ✅</h3>
            <p class="text-blue-800 text-sm">
              Your Firebase token was verified by the backend and synced to PostgreSQL.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-300">
              <h3 class="font-bold text-green-900 mb-2">🔐 Auth</h3>
              <p class="text-green-800 text-sm">Email + Google OAuth configured</p>
            </div>
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-300">
              <h3 class="font-bold text-purple-900 mb-2">💾 Database</h3>
              <p class="text-purple-800 text-sm">PostgreSQL + PostGIS ready</p>
            </div>
            <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-300">
              <h3 class="font-bold text-yellow-900 mb-2">🚀 Backend</h3>
              <p class="text-yellow-800 text-sm">Express API running</p>
            </div>
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-300">
              <h3 class="font-bold text-orange-900 mb-2">🗺️ Frontend Map</h3>
              <p class="text-orange-800 text-sm mb-4">Open nearby issues map beside Backend status.</p>
              <button
                (click)="toggleMap()"
                class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {{ showMap ? 'Hide Map' : 'Open Map' }}
              </button>
            </div>
          </div>

          <div *ngIf="showMap" class="mb-8">
            <div class="bg-white border border-orange-200 rounded-lg p-4">
              <app-map-placeholder [showCloseButton]="false"></app-map-placeholder>
            </div>
          </div>

          <div class="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 class="font-bold text-gray-900 mb-2">User Info:</h3>
            <p class="text-gray-700 text-sm"><strong>Email:</strong> {{ userEmail }}</p>
            <p class="text-gray-700 text-sm"><strong>UID:</strong> {{ userUid }}</p>
            <p class="text-gray-700 text-sm"><strong>Auth Provider:</strong> {{ authProvider }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userEmail = '';
  userUid = '';
  authProvider = '';
  showMap = false;

  constructor() {
    const user = this.authService.getCurrentUser();
    this.userEmail = user?.email || 'Unknown';
    this.userUid = user?.uid || 'Unknown';
    
    // Try to get provider info from custom claims
    user?.getIdTokenResult().then((result: any) => {
      this.authProvider = result.claims.firebase?.sign_in_provider === 'google.com' ? 'Google OAuth' : 'Email';
    }).catch(() => {
      this.authProvider = 'Email/Google';
    });
  }

  toggleMap() {
    this.showMap = !this.showMap;
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Logout failed:', error);
    }
  }
}
