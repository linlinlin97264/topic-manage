import { Routes } from '@angular/router';
import { AuthService } from './service/auth.service';
import { inject } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Functions } from '@angular/fire/functions';
import { TopicListComponent } from './topics/components/topic-list/topic-list.component';
import { canActivate } from '@angular/fire/auth-guard';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { HomePage } from './home/home.page';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomePage,
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'topics/new',
    loadComponent: () => import('./topics/new-topic/new-topic.page')
      .then(m => m.NewTopicPage),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'topics/:id',
    loadComponent: () => import('./topics/topic-detail/topic-detail.page')
      .then(m => m.TopicDetailPage),
    ...canActivate(redirectUnauthorizedToLogin)
  }
];
