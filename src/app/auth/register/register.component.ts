import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
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
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="floating">Username</ion-label>
          <ion-input formControlName="username" type="text"></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label position="floating">Email</ion-label>
          <ion-input formControlName="email" type="email"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Password</ion-label>
          <ion-input formControlName="password" type="password"></ion-input>
        </ion-item>
        
        <!-- 修改密码规则提醒的显示逻辑 -->
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
          <ion-input formControlName="confirmPassword" type="password"></ion-input>
        </ion-item>
        
        <!-- 修改密码不匹配提醒的显示逻辑 -->
        <div class="ion-padding-start" *ngIf="confirmPassword.dirty && registerForm.errors?.['passwordMismatch']">
          <ion-text color="danger">
            <small>Passwords do not match</small>
          </ion-text>
        </div>

        <div class="ion-padding">
          <ion-button expand="block" type="submit" [disabled]="!registerForm.valid">
            Create account
          </ion-button>
          
          <ion-button expand="block" fill="clear" routerLink="/login">
            Already have an account?
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    IonText
  ]
})
export class RegisterComponent {
  registerForm = new FormGroup({
    username: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, passwordValidator]),
    confirmPassword: new FormControl('', Validators.required)
  }, { validators: passwordMatchValidator });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Getter methods for easy access in template
  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }

  async onSubmit() {
    if (this.registerForm.valid) {
      try {
        const { confirmPassword, ...registerData } = this.registerForm.value;
        await this.authService.register(registerData as RegisterData);
        await this.router.navigate(['/topics']);
      } catch (error) {
        console.error('Registration error:', error);
      }
    }
  }
} 