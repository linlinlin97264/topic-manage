import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonInput,
  IonIcon,
  IonText,
  IonChip
} from '@ionic/angular/standalone';
import { TopicService, Topic, UserWithRole } from '../../../services/topic.service';
import { addIcons } from 'ionicons';
import { personAdd, close } from 'ionicons/icons';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonInput,
    IonIcon,
    IonText,
    IonChip
  ],
  template: `
    <div class="ion-padding">
      <h2>Manage Users</h2>
      
      <!-- Add User Form -->
      <ion-item>
        <ion-label position="floating">Add user by email</ion-label>
        <ion-input [formControl]="emailInput" type="email"></ion-input>
      </ion-item>
      
      <div class="ion-padding-vertical">
        <ion-button (click)="addReader()" [disabled]="!emailInput.valid">
          <ion-icon slot="start" name="person-add"></ion-icon>
          Add as Reader
        </ion-button>
        <ion-button (click)="addEditor()" [disabled]="!emailInput.valid">
          <ion-icon slot="start" name="person-add"></ion-icon>
          Add as Editor
        </ion-button>
      </div>

      <!-- Error Message -->
      <ion-text color="danger" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
      </ion-text>

      <!-- Users List -->
      <ion-list>
        <ion-item *ngFor="let user of users">
          <ion-label>
            {{ user.email }}
            <ion-chip [color]="user.role === 'owner' ? 'primary' : (user.role === 'editor' ? 'secondary' : 'tertiary')">
              {{ user.role }}
            </ion-chip>
          </ion-label>
          <ion-button 
            slot="end" 
            fill="clear" 
            color="danger"
            (click)="removeUser(user.id)"
            *ngIf="user.role !== 'owner'">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>
    </div>
  `
})
export class ManageUsersComponent implements OnInit {
  @Input() topicId!: string;
  
  emailInput = new FormControl('', { nonNullable: true });
  users: UserWithRole[] = [];
  errorMessage = '';

  constructor(private topicService: TopicService) {
    addIcons({ personAdd, close });
  }

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.topicService.getTopicUsers(this.topicId).subscribe(
      users => this.users = users,
      error => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Error loading users';
      }
    );
  }

  async addReader() {
    if (this.emailInput.value) {
      try {
        await this.topicService.addReader(this.topicId, this.emailInput.value);
        this.emailInput.reset();
        this.errorMessage = '';
      } catch (error: any) {
        this.errorMessage = error.message || 'Error adding reader';
      }
    }
  }

  async addEditor() {
    if (this.emailInput.value) {
      try {
        await this.topicService.addEditor(this.topicId, this.emailInput.value);
        this.emailInput.reset();
        this.errorMessage = '';
      } catch (error: any) {
        this.errorMessage = error.message || 'Error adding editor';
      }
    }
  }

  async removeUser(userId: string) {
    try {
      await this.topicService.removeUser(this.topicId, userId);
      this.errorMessage = '';
    } catch (error: any) {
      this.errorMessage = error.message || 'Error removing user';
    }
  }
} 