import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonBackButton, IonButtons, IonToast } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-register',
  template: `
    <app-header 
      title="Register"
      [showBack]="true"
      backHref="/login">
    </app-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-input label="Email" type="email" [(ngModel)]="email"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input label="Password" type="password" [(ngModel)]="password"></ion-input>
      </ion-item>
      <ion-item>
        <ion-input label="Comfirm Password" type="password" [(ngModel)]="confirmPassword"></ion-input>
      </ion-item>
      <ion-button expand="block" class="ion-margin-top" (click)="register()">Registre</ion-button>
    </ion-content>
    <ion-toast
      [isOpen]="isToastOpen"
      message="Account created successfully!"
      [duration]="2000"
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
    IonBackButton,
    IonButtons,
    IonToast,
    FormsModule,
    HeaderComponent
  ]
})
export class RegisterPage {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  isToastOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async register() {
    if (this.password !== this.confirmPassword) {
      return;
    }

    try {
      await this.authService.register(this.email, this.password);
      this.isToastOpen = true;
      // 等待 Toast 显示完成后再跳转
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
    }
  }
} 