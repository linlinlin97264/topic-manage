import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonToast } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { FirebaseError } from '@angular/fire/app';

@Component({
  selector: 'app-login',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-input label="Email" type="email" [(ngModel)]="email"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input label="Password" type="password" [(ngModel)]="password"></ion-input>
      </ion-item>
      <ion-button class="ion-margin-top" expand="block" (click)="login()">Login</ion-button>
      <ion-button expand="block" fill="clear" routerLink="/register">Register</ion-button>
      <div class="ion-text-center ion-margin-top">
        <ion-button fill="clear" size="small" (click)="forgotPassword()">
          Forgot Password?
        </ion-button>
      </div>
    </ion-content>
    <ion-toast
      [isOpen]="isToastOpen"
      [message]="toastMessage"
      [duration]="2000"
      [color]="toastColor"
      (didDismiss)="isToastOpen = false"
    ></ion-toast>
  `,
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    FormsModule,
    RouterLink,
    IonToast
  ]
})
export class LoginPage {
  email: string = '';
  password: string = '';
  isToastOpen = false;
  toastMessage = '';
  toastColor = 'success';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login() {
    if (!this.email || !this.password) {
      this.showError('Please enter both email and password');
      return;
    }

    try {
      console.log('Attempting login with:', { email: this.email });
      const result = await this.authService.login(this.email, this.password);
      console.log('Login result:', result);

      if (result.user) {
        console.log('Login successful, user:', result.user);
        this.toastMessage = 'Login successful!';
        this.toastColor = 'success';
        this.isToastOpen = true;
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Navigating to /topics');
          const navigationResult = await this.router.navigate(['/topics']);
          console.log('Navigation result:', navigationResult);
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
      }
    } catch (error: any) {
      console.error('Full error details:', {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      if (error instanceof FirebaseError) {
        console.log('Firebase error code:', error.code);
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/invalid-email':
            this.showError('Invalid email address');
            break;
          case 'auth/user-disabled':
            this.showError('This account has been disabled');
            break;
          case 'auth/user-not-found':
            this.showError('No account found with this email');
            break;
          case 'auth/wrong-password':
            this.showError('Incorrect password');
            break;
          case 'auth/invalid-login-credentials':
            this.showError('Invalid email or password');
            break;
          default:
            this.showError(`Login failed: ${error.code}`);
        }
      } else {
        this.showError('An unexpected error occurred');
      }
      console.error('Login error:', error);
    }
  }

  async forgotPassword() {
    if (!this.email) {
      this.showError('Please enter your email address');
      return;
    }

    try {
      await this.authService.resetPassword(this.email);
      this.toastMessage = 'Password reset email sent. Please check your inbox.';
      this.toastColor = 'success';
      this.isToastOpen = true;
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-email':
            this.showError('Invalid email address');
            break;
          case 'auth/user-not-found':
            this.showError('No account found with this email');
            break;
          default:
            this.showError('Failed to send reset email');
        }
      }
      console.error('Reset password error:', error);
    }
  }

  private showError(message: string) {
    this.toastMessage = message;
    this.toastColor = 'danger';
    this.isToastOpen = true;
  }
} 