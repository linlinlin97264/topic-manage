import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonText,
  ModalController 
} from '@ionic/angular/standalone';
import { Topic } from '../../../services/topic.service';
import { TopicService } from '../../../services/topic.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-edit-topic-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonText
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Edit Topic</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Cancel</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="onSubmit()" [disabled]="!form.valid || !form.dirty">
            Save
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-item>
          <ion-label position="stacked">Name</ion-label>
          <ion-input formControlName="name" type="text"></ion-input>
        </ion-item>

        <div *ngIf="form.get('name')?.touched && form.get('name')?.errors?.['required']" class="ion-padding-start">
          <ion-text color="danger">
            <small>Name is required</small>
          </ion-text>
        </div>

        <ion-item class="ion-margin-top">
          <ion-label position="stacked">Description</ion-label>
          <ion-textarea 
            formControlName="description" 
            rows="6"
            placeholder="Enter a description for your topic..."
          ></ion-textarea>
        </ion-item>

        <div class="ion-padding-top">
          <ion-text color="medium">
            <small>
              Last updated: {{ topic.updatedAt | date:'medium' }}
              <span *ngIf="topic.lastUpdatedByName">
                by {{ topic.lastUpdatedByName }}
              </span>
            </small>
          </ion-text>
        </div>

        <div *ngIf="errorMessage" class="ion-padding">
          <ion-text color="danger">
            <p>{{ errorMessage }}</p>
          </ion-text>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-textarea {
      --padding-top: 8px;
    }
  `]
})
export class EditTopicModalComponent implements OnInit {
  @Input() topic!: Topic;
  errorMessage: string = '';

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('')
  });

  constructor(
    private modalCtrl: ModalController,
    private topicService: TopicService
  ) {}

  ngOnInit() {
    this.form.patchValue({
      name: this.topic.name,
      description: this.topic.description
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async onSubmit() {
    if (this.form.valid && this.form.dirty) {
      const updates = {} as Partial<Topic>;
      
      if (this.form.get('name')?.dirty) {
        updates.name = this.form.get('name')?.value || '';
      }
      
      if (this.form.get('description')?.dirty) {
        updates.description = this.form.get('description')?.value || '';
      }
      
      if (Object.keys(updates).length > 0) {
        try {
          await this.topicService.editTopic(this.topic.id!, updates, this.topic.version);
          this.modalCtrl.dismiss(updates);
        } catch (error: any) {
          this.errorMessage = error.message || 'Failed to update topic';
          console.error('Error updating topic:', error);
          
          if (error.message.includes('modified by another user')) {
            // 如果是版本冲突，自动刷新内容
            const latestTopic = await this.topicService.getTopic(this.topic.id!)
              .pipe(take(1))
              .toPromise();
            
            if (latestTopic) {
              this.topic = latestTopic;
              this.form.patchValue({
                name: latestTopic.name,
                description: latestTopic.description
              });
            }
          }
        }
      } else {
        this.dismiss();
      }
    }
  }
} 