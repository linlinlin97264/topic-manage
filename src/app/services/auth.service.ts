import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, RecaptchaVerifier, sendEmailVerification } from '@angular/fire/auth';
import { UserService } from './user.service';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { RegisterData } from '../models/auth.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly userService = inject(UserService);
  private readonly firestore = inject(Firestore);
  private recaptchaVerifier: RecaptchaVerifier | null = null;

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

  initRecaptcha(buttonId: string) {
    try {
      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, buttonId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          // 重新创建一个新的验证器
          this.recaptchaVerifier = null;
          this.initRecaptcha(buttonId);
        }
      });
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      throw error;
    }
  }

  async register(data: RegisterData) {
    if (!this.recaptchaVerifier) {
      throw new Error('reCAPTCHA not initialized');
    }

    try {
      console.log('Starting registration process');
      
      await this.recaptchaVerifier.verify();
      console.log('reCAPTCHA verified');
      
      const credential = await createUserWithEmailAndPassword(
        this.auth, 
        data.email, 
        data.password
      );
      console.log('User created in Firebase Auth');

      // 发送验证邮件
      if (credential.user) {
        await sendEmailVerification(credential.user);
        console.log('Verification email sent');
      }
      
      // 创建用户档案
      const userRef = doc(this.firestore, `users/${credential.user.uid}`);
      await setDoc(userRef, {
        uid: credential.user.uid,
        email: credential.user.email,
        username: data.username,
        createdAt: new Date(),
        emailVerified: false
      });
      console.log('User profile created in Firestore');

      return credential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      this.recaptchaVerifier = null;
    }
  }

  // 添加检查邮箱验证状态的方法
  isEmailVerified(): boolean {
    return this.auth.currentUser?.emailVerified ?? false;
  }

  // 重新发送验证邮件
  async resendVerificationEmail() {
    const user = this.auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  }

  // 修改登录方法，添加邮箱验证检查
  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      if (!result.user.emailVerified) {
        throw new Error('Please verify your email address first');
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Google 登录
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  // 登出
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // 获取当前认证状态
  getAuth(): Observable<User | null> {
    return new Observable(subscriber => {
      const unsubscribe = onAuthStateChanged(this.auth, 
        user => subscriber.next(user),
        error => subscriber.error(error),
        () => subscriber.complete()
      );
      return unsubscribe;
    });
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
} 