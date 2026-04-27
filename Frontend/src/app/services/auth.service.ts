import { Injectable, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { firebaseAuth } from '../../firebase.config';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = firebaseAuth;
  private apiUrl = `${environment.apiUrl}/users`;

  authUser = signal<any>(null);
  isLoggedIn = signal(false);
  isLoading = signal(true);

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onIdTokenChanged(this.auth, async (user) => {
      this.authUser.set(user);
      this.isLoggedIn.set(!!user);
      this.isLoading.set(false);

      if (user) {
        const token = await user.getIdToken();
        console.log('🔥 Firebase ID Token:', token);
      }
    });
  }

  // ==================== EMAIL ====================
  async signup(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.syncWithBackend(result.user);
      return result.user;
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      await this.syncWithBackend(result.user);
      return result.user;
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  // ==================== GOOGLE ====================
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.syncWithBackend(result.user);
      return result.user;
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  // ==================== SYNC ====================
  private async syncWithBackend(user: any) {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${this.apiUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Backend sync failed');
      }

      return response.json();
    } catch (error: any) {
      console.error('Backend sync error:', error);
      throw error;
    }
  }

  // ==================== GENERAL ====================
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  getCurrentUser() {
    return this.authUser();
  }

  private getErrorMessage(error: any): string {
    const errorMap: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/invalid-email': 'Please enter a valid email',
      'auth/network-request-failed': 'Network error — check your connection',
      'auth/too-many-requests': 'Too many failed attempts — try again later',
    };

    return errorMap[error.code] || error.message || 'Authentication failed';
  }
}