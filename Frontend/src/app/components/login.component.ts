import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome</h1>
        <p class="text-gray-600 text-center mb-8">Sign in to your account</p>

        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {{ error() }}
          </div>
        }

        <!-- Tabs -->
        <div class="flex gap-2 mb-6 border-b border-gray-200">
          <button
            (click)="setAuthMode('email')"
            [class]="'flex-1 py-2 px-1 border-b-2 font-medium transition-colors ' +
              (authMode() === 'email' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700')"
          >
            Email
          </button>
          <button
            (click)="setAuthMode('google')"
            [class]="'flex-1 py-2 px-1 border-b-2 font-medium transition-colors ' +
              (authMode() === 'google' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700')"
          >
            Google
          </button>
        </div>

        <!-- EMAIL MODE -->
        @if (authMode() === 'email') {
          <form (ngSubmit)="onEmailLogin()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                [(ngModel)]="email"
                name="email"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                [(ngModel)]="password"
                name="password"
                type="password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isLoading() ? (isSignup() ? 'Creating account...' : 'Signing in...') : (isSignup() ? 'Sign Up' : 'Sign In') }}
            </button>

            <p class="text-center text-sm text-gray-600">
              @if (!isSignup()) {
                Don't have an account?
                <button
                  type="button"
                  (click)="isSignup.set(true)"
                  class="text-blue-600 hover:underline font-medium"
                >
                  Sign Up
                </button>
              } @else {
                Already have an account?
                <button
                  type="button"
                  (click)="isSignup.set(false)"
                  class="text-blue-600 hover:underline font-medium"
                >
                  Sign In
                </button>
              }
            </p>
          </form>
        }

        <!-- GOOGLE MODE -->
        @if (authMode() === 'google') {
          <button
            (click)="onGoogleLogin()"
            [disabled]="isLoading()"
            class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ isLoading() ? 'Connecting...' : 'Sign in with Google' }}
          </button>
        }
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // UI State
  authMode = signal<'email' | 'google'>('email');
  isSignup = signal(false);
  isLoading = signal(false);
  error = signal<string>('');

  // Email fields
  email = '';
  password = '';

  setAuthMode(mode: 'email' | 'google') {
    this.authMode.set(mode);
    this.error.set('');
    this.isSignup.set(false);
  }

  // ==================== EMAIL ====================
  async onEmailLogin() {
    try {
      this.isLoading.set(true);
      this.error.set('');

      if (this.isSignup()) {
        await this.authService.signup(this.email, this.password);
      } else {
        await this.authService.login(this.email, this.password);
      }

      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err || 'Authentication failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==================== GOOGLE ====================
  async onGoogleLogin() {
    try {
      this.isLoading.set(true);
      this.error.set('');
      
      await this.authService.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err || 'Google sign-in failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}

