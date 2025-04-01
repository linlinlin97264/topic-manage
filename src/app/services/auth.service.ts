import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword } from '@angular/fire/auth';
import { UserService } from './user.service';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { RegisterData } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly userService = inject(UserService);
  private readonly firestore = inject(Firestore);

  constructor() {
    // 监听用户登录状态
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        // 用户登录时，确保用户档案存在
        const userRef = doc(this.firestore, `users/${user.uid}`);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            username: user.email?.split('@')[0] || 'Unknown user'
          });
        }
      }
    });
  }

  async register(data: RegisterData) {
    const credential = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
    
    // 创建用户档案，包含用户名
    const userRef = doc(this.firestore, `users/${credential.user.uid}`);
    await setDoc(userRef, {
      uid: credential.user.uid,
      email: credential.user.email,
      username: data.username
    });

    return credential;
  }
} 