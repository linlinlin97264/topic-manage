import { Routes, Router } from '@angular/router';
import { AuthService } from './service/auth.service';
import { inject } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Functions } from '@angular/fire/functions';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'topics',
    canActivate: [
      () => {
        const _authService = inject(AuthService);
        const _router = inject(Router);
        return _authService.getAuth().pipe(
          tap(user => console.log('Current user:', user)),
          map((user) => {
            if(!user) {
              console.log('No user, redirecting to login');
              _router.navigateByUrl('/login');
              return false;
            }
            return true;
          })
        );
      }
    ],
    loadComponent: () =>
      import('./topics/topics.page').then((m) => m.TopicsPage),
    providers: [
      { provide: Functions, useFactory: () => inject(Functions) }
    ]
  },
  {
    path: 'topics/:id',
    loadComponent: () =>
      import('./topics/topic-detail/topic-detail.page').then(
        (m) => m.TopicDetailPage
      ),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
