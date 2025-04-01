import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-topic',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
        <ion-title>New Topic</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="confirm()" [strong]="true" [disabled]="!form.valid">
            Confirm
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-item>
          <ion-input
            label="Name"
            labelPlacement="floating"
            formControlName="name"
            placeholder="Enter topic name"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Description"
            labelPlacement="floating"
            formControlName="description"
            placeholder="Enter topic description"
          ></ion-input>
        </ion-item>
      </form>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule]
})
export class CreateTopicModal {
  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]]
    });
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.form.valid) {
      return this.modalCtrl.dismiss(this.form.value, 'confirm');
    }
    return this.modalCtrl.dismiss(null, 'cancel');
  }
}
