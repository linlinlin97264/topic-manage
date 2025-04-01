import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonList, 
  IonItem, 
  IonLabel, 
  IonItemSliding, 
  IonItemOptions, 
  IonItemOption,
  IonIcon,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { Topic, TopicService } from '../../../services/topic.service';
import { addIcons } from 'ionicons';
import { heart, heartOutline, trash } from 'ionicons/icons';

@Component({
  selector: 'app-topic-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonList,
    IonItem,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon
  ],
  template: `
    <ion-list>
      <ion-item-sliding *ngFor="let topic of topics">
        <ion-item [routerLink]="['/topics', topic.id]">
          <ion-label>
            <h2>{{ topic.name }}</h2>
            <p>{{ topic.description }}</p>
            <p>
              <small>
                Owner: {{ topic.ownerName }}
                <span *ngIf="topic.updatedAt">
                  · Last updated: {{ topic.updatedAt | date:'short' }}
                  <span *ngIf="topic.lastUpdatedByName">
                    by {{ topic.lastUpdatedByName }}
                  </span>
                </span>
              </small>
            </p>
          </ion-label>
          <ion-icon 
            slot="end" 
            [name]="isFavorite(topic) ? 'heart' : 'heart-outline'"
            [color]="isFavorite(topic) ? 'danger' : 'medium'"
          ></ion-icon>
        </ion-item>

        <ion-item-options side="end">
          <ion-item-option color="danger" (click)="deleteTopic(topic)">
            <ion-icon slot="icon-only" name="trash"></ion-icon>
          </ion-item-option>
          <ion-item-option color="primary" (click)="toggleFavorite(topic)">
            <ion-icon slot="icon-only" [name]="isFavorite(topic) ? 'heart' : 'heart-outline'"></ion-icon>
          </ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
    </ion-list>
  `,
  styles: [`
    ion-item-option {
      --padding-start: 1rem;
      --padding-end: 1rem;
    }
    ion-icon {
      font-size: 1.2rem;
    }
    ion-label h2 {
      font-weight: 500;
      margin-bottom: 4px;
    }
    ion-label p small {
      color: var(--ion-color-medium);
    }
  `]
})
export class TopicListComponent {
  @Input() topics: Topic[] = [];
  private favorites: Set<string> = new Set();

  constructor(
    private topicService: TopicService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ heart, heartOutline, trash });
    // 从 localStorage 加载收藏
    const savedFavorites = localStorage.getItem('topic-favorites');
    if (savedFavorites) {
      this.favorites = new Set(JSON.parse(savedFavorites));
    }
  }

  async deleteTopic(topic: Topic) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${topic.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await this.topicService.removeTopic(topic.id!);
              // 可选：显示成功消息
              const toast = await this.toastController.create({
                message: 'Topic deleted successfully',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              console.error('Error deleting topic:', error);
              // 显示错误消息
              const errorToast = await this.toastController.create({
                message: error instanceof Error ? error.message : 'Error deleting topic',
                duration: 3000,
                color: 'danger'
              });
              await errorToast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  toggleFavorite(topic: Topic) {
    if (this.favorites.has(topic.id!)) {
      this.favorites.delete(topic.id!);
    } else {
      this.favorites.add(topic.id!);
    }
    // 保存到 localStorage
    localStorage.setItem('topic-favorites', JSON.stringify([...this.favorites]));
  }

  isFavorite(topic: Topic): boolean {
    return this.favorites.has(topic.id!);
  }
} 