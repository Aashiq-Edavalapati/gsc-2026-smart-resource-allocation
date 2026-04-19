import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
        
        @if (error()) {
          <div class="bg-red-100 text-red-700 p-3 rounded mb-4">{{ error() }}</div>
        }
        
        <form (ngSubmit)="onLogin()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input [(ngModel)]="email" name="email" type="email" class="w-full px-3 py-2 border rounded" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Password</label>
            <input [(ngModel)]="password" name="password" type="password" class="w-full px-3 py-2 border rounded" required />
          </div>
          
          <button type="submit" [disabled]="isLoading()" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {{ isLoading() ? 'Loading...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal<string>('');
  isLoading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  async onLogin() {
    try {
      this.isLoading.set(true);
      this.error.set('');
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set(err.message || 'Login failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}
