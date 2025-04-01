import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Register</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="floating">Username</ion-label>
          <ion-input type="text" formControlName="username"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Email</ion-label>
          <ion-input type="email" formControlName="email"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Password</ion-label>
          <ion-input type="password" formControlName="password"></ion-input>
        </ion-item>

        <div class="ion-padding-top">
          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="!registerForm.valid"
            id="register-button">  <!-- 添加 id 用于 reCAPTCHA -->
            Register
          </ion-button>
        </div>
      </form>

      <div class="ion-padding-top ion-text-center">
        <ion-button fill="clear" routerLink="/login">
          Already have an account? Login
        </ion-button>
      </div>
    </ion-content>
  `
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // 初始化 reCAPTCHA
    this.authService.initRecaptcha('register-button');
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        await this.authService.register({
          username: this.registerForm.value.username,
          email: this.registerForm.value.email,
          password: this.registerForm.value.password
        });

        const toast = await this.toastController.create({
          message: 'Registration successful!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        await this.router.navigate(['/login']);
      } catch (error) {
        console.error('Registration error:', error);
        const toast = await this.toastController.create({
          message: error instanceof Error ? error.message : 'Registration failed',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    }
  }
} 