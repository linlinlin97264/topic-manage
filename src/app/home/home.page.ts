import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton,
  IonButtons,
  IonIcon,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { TopicService, Topic } from '../services/topic.service';
import { TopicListComponent } from '../topics/components/topic-list/topic-list.component';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Observable, map, of, catchError } from 'rxjs';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonFab,
    IonFabButton,
    TopicListComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Topics</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            Logout
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <app-topic-list [topics]="(topics$ | async) ?? []"></app-topic-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button routerLink="/topics/new">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `
})
export class HomePage {
  topics$: Observable<Topic[]>;

  constructor(
    private topicService: TopicService,
    private auth: Auth,
    private router: Router
  ) {
    addIcons({ add });
    this.topics$ = this.topicService.getTopics().pipe(
      map(topics => topics ?? []),
      // 如果出错，返回空数组
      catchError(error => {
        console.error('Error fetching topics:', error);
        return of([]);
      })
    );
  }

  async logout() {
    try {
      await this.auth.signOut();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
} 