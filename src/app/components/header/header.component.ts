import { Component, Input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton, IonToast } from '@ionic/angular/standalone';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" *ngIf="showBack">
          <ion-back-button [defaultHref]="backHref"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
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
    IonButtons,
    IonButton,
    IonIcon,
    IonBackButton,
    CommonModule,
    IonToast
  ]
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() showBack: boolean = false;
  @Input() backHref: string = '/topics';

  isToastOpen = false;
  toastMessage = '';
  toastColor = 'success';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ logOutOutline });
  }

  async logout() {
    try {
      await this.authService.logout();
      this.toastMessage = 'Logged out successfully';
      this.toastColor = 'success';
      this.isToastOpen = true;
      
      // 等待 toast 显示一会儿后再跳转
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
      this.toastMessage = 'Error logging out';
      this.toastColor = 'danger';
      this.isToastOpen = true;
    }
  }
} 