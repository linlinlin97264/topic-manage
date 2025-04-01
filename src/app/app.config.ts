import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(
      provideFirebaseApp(() => initializeApp({
        // 你的 Firebase 配置
      })),
      provideAuth(() => {
        const auth = getAuth();
        // 启用持久化会话
        auth.setPersistence('local');
        return auth;
      }),
      provideFirestore(() => getFirestore()),
      provideFunctions(() => getFunctions())
    )
  ]
}; 