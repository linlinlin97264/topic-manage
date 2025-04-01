import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  ToastController,
  IonText
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { FirebaseError } from '@angular/fire/app';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonText
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="floating">Email</ion-label>
          <ion-input type="email" formControlName="email"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Password</ion-label>
          <ion-input type="password" formControlName="password"></ion-input>
        </ion-item>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" [disabled]="!loginForm.valid">
            Login
          </ion-button>
        </div>
      </form>

      <div class="ion-padding-top ion-text-center">
        <ion-button expand="block" color="danger" (click)="signInWithGoogle()">
          <ion-icon slot="start" name="logo-google"></ion-icon>
          Sign in with Google
        </ion-button>
      </div>

      <div class="ion-padding-top ion-text-center">
        <ion-button fill="clear" [routerLink]="['/register']">
          Don't have an account? Register
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-button[color="danger"] {
      --ion-color-danger: #db4437;
      --ion-color-danger-rgb: 219,68,55;
      margin-top: 20px;
    }
  `]
})
export class LoginPage {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ logoGoogle });
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        const { email, password } = this.loginForm.value;
        const result = await this.authService.login(email, password);
        
        if (result.user) {
          const toast = await this.toastController.create({
            message: 'Login successful!',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
          await this.router.navigate(['/home']);
        }
      } catch (error) {
        console.error('Login error:', error);
        const message = error instanceof FirebaseError 
          ? this.getErrorMessage(error.code)
          : 'An unexpected error occurred';
          
        const toast = await this.toastController.create({
          message,
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    }
  }

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      const toast = await this.toastController.create({
        message: 'Login successful!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      await this.router.navigate(['/home']);
    } catch (error) {
      console.error('Google sign in error:', error);
      const toast = await this.toastController.create({
        message: 'Failed to sign in with Google. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-login-credentials':
        return 'Invalid email or password';
      default:
        return `Login failed: ${errorCode}`;
    }
  }
} 