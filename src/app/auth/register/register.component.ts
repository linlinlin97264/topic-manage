import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  ToastController,
  IonText
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { RegisterData } from '../../models/auth.model';

// 自定义密码验证器
function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
  const errors: ValidationErrors = {};
  
  if (!hasUpperCase) errors['noUpperCase'] = true;
  if (!hasLowerCase) errors['noLowerCase'] = true;
  if (!hasNumeric) errors['noNumeric'] = true;
  if (!hasSpecialChar) errors['noSpecialChar'] = true;
  if (value.length < 8) errors['minLength'] = true;
  
  return Object.keys(errors).length ? errors : null;
}

// 确认密码验证器
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (password?.value !== confirmPassword?.value) {
    return { passwordMismatch: true };
  }
  
  return null;
}

@Component({
  selector: 'app-register',
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
    IonButtons,
    IonBackButton,
    IonText
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Register</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div [formGroup]="registerForm">
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
        
        <div class="ion-padding-start ion-margin-bottom" *ngIf="password.dirty">
          <ion-text [color]="password.errors?.['minLength'] ? 'danger' : 'success'">
            <small>• At least 8 characters long</small>
          </ion-text><br>
          <ion-text [color]="password.errors?.['noUpperCase'] ? 'danger' : 'success'">
            <small>• At least one uppercase letter</small>
          </ion-text><br>
          <ion-text [color]="password.errors?.['noLowerCase'] ? 'danger' : 'success'">
            <small>• At least one lowercase letter</small>
          </ion-text><br>
          <ion-text [color]="password.errors?.['noNumeric'] ? 'danger' : 'success'">
            <small>• At least one number</small>
          </ion-text><br>
          <ion-text [color]="password.errors?.['noSpecialChar'] ? 'danger' : 'success'">
            <small>• At least one special character (!&#64;#$%^&*)</small>
          </ion-text>
        </div>

        <ion-item>
          <ion-label position="floating">Confirm Password</ion-label>
          <ion-input type="password" formControlName="confirmPassword"></ion-input>
        </ion-item>
        
        <div class="ion-padding-start" *ngIf="confirmPassword.dirty && registerForm.errors?.['passwordMismatch']">
          <ion-text color="danger">
            <small>Passwords do not match</small>
          </ion-text>
        </div>

        <div class="ion-padding-top">
          <ion-button 
            expand="block" 
            (click)="handleSubmit()"
            [disabled]="!registerForm.valid"
            id="register-button">
            Register
          </ion-button>
        </div>
      </div>

      <div class="ion-padding-top ion-text-center">
        <ion-button fill="clear" routerLink="/login">
          Already have an account? Login
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 16px;
    }
    
    ion-button[type="submit"] {
      margin-top: 24px;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    console.log('Register component constructor');
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    console.log('Register component initialized');
    try {
      this.authService.initRecaptcha('register-button');
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
    }
  }

  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }

  async handleSubmit() {
    console.log('Submit button clicked');
    console.log('Form value:', this.registerForm.value);
    console.log('Form valid:', this.registerForm.valid);

    if (this.registerForm.valid) {
      try {
        const { confirmPassword, ...registerData } = this.registerForm.value;
        await this.authService.register(registerData);
        
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
    } else {
      console.log('Form is invalid');
      console.log('Form errors:', this.registerForm.errors);
      const toast = await this.toastController.create({
        message: 'Please check all fields are valid',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    }
  }
} 