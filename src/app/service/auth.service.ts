import { inject, Injectable } from '@angular/core';
import { 
  Auth, 
  user, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  getAuth(): Observable<User | null> {
    return user(this.auth);
  }

  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return result;
    } catch (error) {
      console.error('Auth service login error:', error);
      throw error;
    }
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    try {
      await signOut(this.auth);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
}
