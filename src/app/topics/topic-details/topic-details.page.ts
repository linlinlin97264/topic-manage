import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ModalController, PopoverController } from '@ionic/angular';
import { TopicService, Topic, Post } from '../../services/topic.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { ItemManagementPopover } from '../popover/item-management/item-management.component';
import { HeaderComponent } from '../../components/header/header.component';
import { addIcons } from 'ionicons';
import { addOutline, ellipsisVerticalOutline } from 'ionicons/icons';

@Component({
  selector: 'app-topic-details',
  template: `
    <app-header 
      [title]="(topic$ | async)?.name || 'Topic Details'"
      [showBack]="true">
    </app-header>
    <ion-content>
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="addPost()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-list>
        <ion-item *ngFor="let post of posts$ | async">
          <ion-label>
            <h2>{{ post.title }}</h2>
            <p>{{ post.content }}</p>
            <p class="ion-text-end">
              <small>{{ post.createdAt | date:'medium' }}</small>
            </p>
          </ion-label>
          <ion-button slot="end" fill="clear" (click)="presentPopover($event, post)">
            <ion-icon name="ellipsis-vertical-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <div *ngIf="(posts$ | async)?.length === 0" class="ion-padding ion-text-center">
        <p>No posts yet. Create the first one!</p>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    HeaderComponent
  ]
})
export class TopicDetailsPage implements OnInit {
  topic$!: Observable<Topic>;
  posts$!: Observable<Post[]>;
  topicId!: string;

  constructor(
    private route: ActivatedRoute,
    private topicService: TopicService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private router: Router
  ) {
    addIcons({ addOutline, ellipsisVerticalOutline });
  }

  ngOnInit() {
    this.topicId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.topicId) {
      this.router.navigate(['/topics']);
      return;
    }
    
    // Récupérer le topic
    this.topic$ = this.topicService.getTopic(this.topicId);
    // Récupérer les posts
    this.posts$ = this.topicService.getPosts(this.topicId);
  }

  async addPost() {
    const modal = await this.modalCtrl.create({
      component: CreatePostModal,
      componentProps: {
        topicId: this.topicId
      }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      // Rafraîchir les posts après l'ajout
      this.posts$ = this.topicService.getPosts(this.topicId);
    }
  }

  async presentPopover(event: Event, post: Post) {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      componentProps: {
        item: post,
        parentId: this.topicId,
        type: 'post'
      },
      event
    });
    await popover.present();

    const { data } = await popover.onWillDismiss();
    if (data) {
      // Rafraîchir les posts après une modification
      this.posts$ = this.topicService.getPosts(this.topicId);
    }
  }
}
