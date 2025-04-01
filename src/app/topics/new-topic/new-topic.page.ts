import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { TopicService } from '../../services/topic.service';

@Component({
  selector: 'app-new-topic',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonButtons,
    IonBackButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>New Topic</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="topicForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="floating">Name</ion-label>
          <ion-input type="text" formControlName="name"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Description</ion-label>
          <ion-textarea formControlName="description" rows="4"></ion-textarea>
        </ion-item>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" [disabled]="!topicForm.valid">
            Create Topic
          </ion-button>
        </div>
      </form>
    </ion-content>
  `
})
export class NewTopicPage {
  topicForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private topicService: TopicService,
    private router: Router
  ) {
    this.topicForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  async onSubmit() {
    if (this.topicForm.valid) {
      try {
        await this.topicService.addTopic(this.topicForm.value);
        await this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error creating topic:', error);
      }
    }
  }
} 