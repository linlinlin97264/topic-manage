import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';

interface User {
  uid: string;
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  async createUserProfile(uid: string, email: string) {
    const userRef = doc(this.firestore, `users/${uid}`);
    const username = email.split('@')[0]; // Utilise la partie avant @ comme username
    
    await setDoc(userRef, {
      uid,
      email,
      username
    });
  }

  async getUserByEmail(email: string) {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      return {
        uid: userDoc.id,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }
} 