import { Component } from '@angular/core';
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
  ModalController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-add-post-modal',
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
    IonTextarea
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Post</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="floating">Title</ion-label>
          <ion-input formControlName="title" type="text"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Content</ion-label>
          <ion-textarea formControlName="content" rows="6"></ion-textarea>
        </ion-item>

        <div class="ion-padding">
          <ion-button expand="block" type="submit" [disabled]="!form.valid">
            Create Post
          </ion-button>
        </div>
      </form>
    </ion-content>
  `
})
export class AddPostModalComponent {
  form = new FormGroup({
    title: new FormControl('', Validators.required),
    content: new FormControl('', Validators.required)
  });

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  onSubmit() {
    if (this.form.valid) {
      this.modalCtrl.dismiss(this.form.value);
    }
  }
} 