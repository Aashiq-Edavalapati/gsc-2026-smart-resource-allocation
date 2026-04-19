import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../../firebase.config';
import { signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = firebaseAuth;
  
  // Auth state signals
  authUser = signal<any>(null);
  isLoggedIn = signal(false);
  isLoading = signal(true);

  constructor() {
    this.initAuthListener();
  }

  // Monitor auth state changes
  private initAuthListener() {
    onAuthStateChanged(this.auth, (user) => {
      this.authUser.set(user);
      this.isLoggedIn.set(!!user);
      this.isLoading.set(false);
    });
  }

  // Sign up
  async signup(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error: any) {
      throw error.message;
    }
  }

  // Sign in
  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error: any) {
      throw error.message;
    }
  }

  // Sign out
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw error.message;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.authUser();
  }
}
