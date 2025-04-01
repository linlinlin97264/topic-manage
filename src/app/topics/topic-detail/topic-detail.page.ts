import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  ModalController
} from '@ionic/angular/standalone';
import { TopicService, Topic } from '../../services/topic.service';
import { ManageUsersComponent } from '../components/manage-users/manage-users.component';
import { EditTopicModalComponent } from '../components/edit-topic-modal/edit-topic-modal.component';
import { AddPostModalComponent } from '../components/add-post-modal/add-post-modal.component';
import { addIcons } from 'ionicons';
import { createOutline } from 'ionicons/icons';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-topic-detail',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/topics"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ (topic$ | async)?.name }}</ion-title>
        
        <!-- 添加编辑按钮 -->
        <ion-buttons slot="end" *ngIf="canEdit$ | async">
          <ion-button (click)="presentEditModal()">
            <ion-icon slot="icon-only" name="create-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ng-container *ngIf="topic$ | async as topic">
        <div class="topic-header">
          <h1>{{ topic.name }}</h1>
          <p>{{ topic.description }}</p>
          <div class="topic-meta">
            <p>Created by: {{ topic.ownerName }}</p>
            <ion-button 
              *ngIf="canEdit$ | async"
              fill="clear"
              size="small"
              (click)="presentEditModal()"
            >
              <ion-icon slot="start" name="create-outline"></ion-icon>
              Edit Topic
            </ion-button>
          </div>
        </div>

        <!-- 只有 owner 可以看到管理用户部分 -->
        <div *ngIf="isOwner$ | async">
          <h2>Manage Access</h2>
          <app-manage-users [topicId]="topicId"></app-manage-users>
        </div>

        <!-- 添加帖子部分 - 允许 editors 添加帖子 -->
        <div *ngIf="canEdit$ | async">
          <ion-button expand="block" (click)="presentAddPostModal()">
            Add Post
          </ion-button>
        </div>

        <!-- 显示帖子列表 -->
        <div class="posts">
          <ng-container *ngIf="posts$ | async as posts">
            <ion-list>
              <ion-item *ngFor="let post of posts">
                <ion-label>
                  <h2>{{ post.title }}</h2>
                  <p>{{ post.content }}</p>
                  <p class="ion-text-end">
                    <small>
                      Posted by {{ post.authorName }} 
                      on {{ post.createdAt | date:'medium' }}
                    </small>
                  </p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ng-container>
        </div>
      </ng-container>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    ManageUsersComponent,
    EditTopicModalComponent,
    AddPostModalComponent
  ],
  styles: [`
    .topic-header {
      margin-bottom: 20px;
    }
    .topic-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--ion-color-medium);
    }
  `]
})
export class TopicDetailPage implements OnInit {
  topicId!: string;
  topic$!: Observable<Topic>;
  isOwner$!: Observable<boolean>;
  canEdit$!: Observable<boolean>;
  posts$!: Observable<Post[]>;

  constructor(
    private route: ActivatedRoute,
    private topicService: TopicService,
    private modalCtrl: ModalController
  ) {
    addIcons({ createOutline });
  }

  ngOnInit() {
    this.topicId = this.route.snapshot.paramMap.get('id') || '';
    this.topic$ = this.topicService.getTopic(this.topicId);
    this.isOwner$ = this.topic$.pipe(
      map(topic => topic.owner === this.topicService.getCurrentUserId())
    );
    this.canEdit$ = this.topic$.pipe(
      map(topic => this.topicService.canEditTopic(topic))
    );
    this.posts$ = this.topicService.getPosts(this.topicId);
  }

  async presentEditModal() {
    const topic = await this.topic$.pipe(take(1)).toPromise();
    if (!topic) return;

    const modal = await this.modalCtrl.create({
      component: EditTopicModalComponent,
      componentProps: {
        topic
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      try {
        await this.topicService.editTopic(this.topicId, data, topic.version);
      } catch (error) {
        console.error('Error updating topic:', error);
      }
    }
  }

  async presentAddPostModal() {
    const modal = await this.modalCtrl.create({
      component: AddPostModalComponent
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      try {
        await this.topicService.addPost(this.topicId, data);
      } catch (error) {
        console.error('Error adding post:', error);
      }
    }
  }
} 