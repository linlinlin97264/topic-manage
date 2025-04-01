import { Component, inject, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import { ModalController } from '@ionic/angular/standalone';
import { Post } from 'src/app/services/topic.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, filter, map } from 'rxjs';

@Component({
  selector: 'app-create-post',
  imports: [IonicModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="postForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="cancel()" color="medium">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Welcome</ion-title>
          <ion-buttons slot="end">
            <ion-button
              type="submit"
              [disabled]="this.postForm.invalid"
              [strong]="true"
              >Confirm</ion-button
            >
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" [fullscreen]="true">
        <ion-input
          formControlName="title"
          fill="solid"
          label="Enter post title"
          labelPlacement="floating"
          placeholder="Post title"
          [helperText]="
            'Enter a title with at least ' + NAME_MIN_LENGTH + ' characters.'
          "
          [errorText]="titleErrorText()"
        ></ion-input>
        <ion-input
          formControlName="content"
          fill="solid"
          label="Enter post content"
          labelPlacement="floating"
          placeholder="Post content"
          [helperText]="
            'Enter content with a maximum of ' +
            CONTENT_MAX_LENGTH +
            ' characters.'
          "
          [errorText]="contentErrorText"
        ></ion-input>
      </ion-content>
    </form>
  `,
})
export class CreatePostModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  readonly CONTENT_MAX_LENGTH = 255;
  readonly NAME_MIN_LENGTH = 3;

  topicId!: string;
  post: Post | undefined;

  ngOnInit(): void {
    if (this.post) {
      this.postTitleControl?.setValue(this.post.title);
      this.postContentControl?.setValue(this.post.content ?? '');
    }
  }

  postForm = this.fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(this.NAME_MIN_LENGTH)],
    ],
    content: ['', [Validators.maxLength(this.CONTENT_MAX_LENGTH)]],
  });

  titleErrorText$: Observable<string> = this.postForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.postTitleControl?.errors &&
        this.postTitleControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.postTitleControl?.errors &&
        this.postTitleControl?.errors['minlength']
      ) {
        return `Title should have at least ${this.NAME_MIN_LENGTH} characters`;
      }
      return '';
    })
  );

  titleErrorText = toSignal(this.titleErrorText$);
  contentErrorText = `Content should have less than ${this.CONTENT_MAX_LENGTH} characters`;

  get postTitleControl(): AbstractControl<string | null, string | null> | null {
    return this.postForm.get('title');
  }

  get postContentControl(): AbstractControl<string | null, string | null> | null {
    return this.postForm.get('content');
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }

  async onSubmit(): Promise<void> {
    try {
      if (this.post) {
        await this.topicService.editPost(
          this.topicId,
          this.post.id!,
          {
            title: this.postForm.value.title!,
            content: this.postForm.value.content!,
          }
        );
      } else {
        await this.topicService.addPost(this.topicId, {
          title: this.postForm.value.title!,
          content: this.postForm.value.content!,
        });
      }
      this.modalCtrl.dismiss(null, 'confirm');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  }
}
