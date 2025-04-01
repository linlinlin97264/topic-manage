import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonButtons,
  IonFab,
  IonFabButton,
  ModalController,
  IonLoading
} from '@ionic/angular/standalone';
import { TopicService, Topic } from '../services/topic.service';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { HeaderComponent } from '../components/header/header.component';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-topics',
  template: `
    <app-header title="Topics"></app-header>
    <ion-content>
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="addTopic()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-list>
        <ion-item *ngFor="let topic of topics$ | async">
          <ion-label [routerLink]="['/topics', topic.id]">
            <h2>{{ topic.name }}</h2>
            <p *ngIf="topic.description">{{ topic.description }}</p>
            <p>Owner: {{ topic.ownerName }}</p>
            <p>Readers: {{ topic.readers?.length || 0 }}</p>
            <p class="ion-text-end" *ngIf="topic.createdAt">
              <small>Created: {{ topic.createdAt | date:'medium' }}</small>
            </p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div *ngIf="(topics$ | async)?.length === 0" class="ion-padding ion-text-center">
        <p>No topics yet. Create your first topic!</p>
      </div>

      <ion-loading [isOpen]="isLoading"></ion-loading>
    </ion-content>
  `,
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    RouterLink,
    CommonModule,
    AsyncPipe,
    DatePipe,
    IonButtons,
    IonFab,
    IonFabButton,
    HeaderComponent,
    CreateTopicModal,
    IonLoading
  ],
  providers: [
    TopicService,
    UserService
  ]
})
export class TopicsPage implements OnInit {
  topics$: Observable<Topic[]>;
  isLoading = true;
  private topicService = inject(TopicService);
  private modalCtrl = inject(ModalController);

  constructor() {
    this.topics$ = this.topicService.getTopics().pipe(
      tap(topics => {
        console.log('Received topics:', topics);
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error loading topics:', error);
        this.isLoading = false;
        return of([]);
      })
    );
    addIcons({ addOutline });
  }

  ngOnInit() {
  }

  async addTopic() {
    const modal = await this.modalCtrl.create({
      component: CreateTopicModal,
      componentProps: {}
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      try {
        await this.topicService.addTopic(data);
      } catch (error) {
        console.error('Error adding topic:', error);
      }
    }
  }
}
