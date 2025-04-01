import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, addDoc, deleteDoc, getDoc, docData, Timestamp, arrayUnion, arrayRemove, setDoc, runTransaction, getDocs, writeBatch } from '@angular/fire/firestore';
import { Observable, map, tap, from, switchMap } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { UserService } from './user.service';
import { Post } from '../models/post.model';

export interface Topic {
  id?: string;
  name: string;
  description?: string;
  owner: string;
  ownerName?: string;
  readers: string[];
  editors: string[];
  createdAt?: Date;
  updatedAt?: Date;
  lastUpdatedBy?: string;
  lastUpdatedByName?: string;
  version: number;
}

export interface UserWithRole {
  id: string;
  email: string;
  role: 'owner' | 'editor' | 'reader';
}

@Injectable({
  providedIn: 'root',
  deps: []
})
export class TopicService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly userService = inject(UserService);

  constructor() {}

  private convertTimestamps<T>(data: any): T {
    if (!data) return data;
    
    const result = { ...data };
    if (result.createdAt && result.createdAt instanceof Timestamp) {
      result.createdAt = result.createdAt.toDate();
    }
    return result as T;
  }

  getTopics(): Observable<Topic[]> {
    console.log('Fetching topics...');
    const topicsRef = collection(this.firestore, 'topics');
    return collectionData(topicsRef, { idField: 'id' }).pipe(
      tap(topics => console.log('Raw topics:', topics)),
      switchMap(topics => from(Promise.all(topics.map(async topic => {
        console.log('Processing topic:', topic);
        const ownerDoc = await getDoc(doc(this.firestore, `users/${topic['owner']}`));
        const ownerData = ownerDoc.data();
        return {
          id: topic['id'],
          name: topic['name'] as string,
          description: topic['description'] as string,
          owner: topic['owner'] as string,
          readers: topic['readers'] as string[] || [],
          editors: topic['editors'] as string[] || [],
          createdAt: topic['createdAt'] ? (topic['createdAt'] as Timestamp).toDate() : undefined,
          updatedAt: topic['updatedAt'] ? (topic['updatedAt'] as Timestamp).toDate() : undefined,
          lastUpdatedBy: topic['lastUpdatedBy'] as string,
          lastUpdatedByName: topic['lastUpdatedByName'] as string,
          ownerName: ownerData?.['username'] || ownerData?.['email'] || 'Unknown user',
          version: topic['version'] || 0
        } as Topic;
      })))),
      map(topics => topics.filter(topic => this.canAccessTopic(topic))),
      tap(topics => console.log('Filtered topics:', topics))
    );
  }

  async addPost(topicId: string, post: Omit<Post, 'id' | 'createdAt' | 'author' | 'authorName'>) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const topicRef = doc(this.firestore, `topics/${topicId}`);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) {
      throw new Error(`Topic with id ${topicId} does not exist`);
    }

    const postsRef = collection(this.firestore, `topics/${topicId}/posts`);
    return addDoc(postsRef, {
      ...post,
      author: user.uid,
      createdAt: new Date()
    });
  }

  async editPost(topicId: string, postId: string, post: Partial<Post>) {
    const postRef = doc(this.firestore, `topics/${topicId}/posts/${postId}`);
    return updateDoc(postRef, post);
  }

  async removePost(topicId: string, postId: string) {
    const postRef = doc(this.firestore, `topics/${topicId}/posts/${postId}`);
    return deleteDoc(postRef);
  }

  async addTopic(topic: Omit<Topic, 'id' | 'createdAt' | 'owner' | 'readers' | 'version'>) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // 获取用户信息
    const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
    const userData = userDoc.data();
    const userName = userData?.['username'] || userData?.['email'] || 'Unknown user';

    // 然后创建 topic
    const topicsRef = collection(this.firestore, 'topics');
    return addDoc(topicsRef, {
      ...topic,
      owner: user.uid,
      readers: [],
      editors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdatedBy: user.uid,
      lastUpdatedByName: userName,
      version: 0
    });
  }

  async editTopic(topicId: string, updates: Partial<Topic>, expectedVersion: number) {
    console.log('Starting edit with expected version:', expectedVersion);
    
    const topicRef = doc(this.firestore, `topics/${topicId}`);
    
    try {
      // 使用事务来确保原子性操作
      await runTransaction(this.firestore, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) {
          throw new Error('Topic not found');
        }

        const currentData = topicDoc.data();
        const currentVersion = currentData['version'] ?? 0;
        const currentUser = this.auth.currentUser;
        
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        // 获取当前用户的信息
        const userDoc = await getDoc(doc(this.firestore, `users/${currentUser.uid}`));
        const userData = userDoc.data();
        const userName = userData?.['username'] || userData?.['email'] || 'Unknown user';
        
        // 检查版本号
        if (currentVersion !== expectedVersion) {
          throw new Error('Topic has been modified by another user. Please refresh and try again.');
        }

        // 构建更新数据
        const newData = {
          ...currentData,  // 保留所有现有字段
          name: updates.name || currentData['name'],
          description: updates.description ?? currentData['description'],
          owner: currentData['owner'],
          editors: currentData['editors'] || [],
          readers: currentData['readers'] || [],
          version: currentVersion + 1,
          updatedAt: new Date(),
          lastUpdatedBy: currentUser.uid,
          lastUpdatedByName: userName
        };

        // 在事务中执行更新
        transaction.update(topicRef, newData);
      });

      console.log('Update successful');
      return true;
    } catch (error) {
      console.error('Edit topic error:', error);
      throw error;
    }
  }

  async removeTopic(topicId: string) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 先检查用户权限
      const topicRef = doc(this.firestore, `topics/${topicId}`);
      const topicDoc = await getDoc(topicRef);
      
      if (!topicDoc.exists()) {
        throw new Error('Topic not found');
      }

      const topicData = topicDoc.data();
      if (topicData['owner'] !== user.uid) {
        throw new Error('Permission denied: Only owner can delete topics');
      }

      // 删除主题下的所有帖子
      const postsRef = collection(this.firestore, `topics/${topicId}/posts`);
      const postsSnapshot = await getDocs(postsRef);
      
      const batch = writeBatch(this.firestore);
      
      // 添加所有帖子的删除操作到批处理中
      postsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 添加主题的删除操作到批处理中
      batch.delete(topicRef);
      
      // 执行批处理
      await batch.commit();
      
      console.log('Topic and all its posts deleted successfully');
    } catch (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  }

  getPosts(topicId: string): Observable<Post[]> {
    const postsRef = collection(this.firestore, `topics/${topicId}/posts`);
    return collectionData(postsRef, { idField: 'id' }).pipe(
      switchMap(posts => from(Promise.all(posts.map(async post => {
        const authorDoc = await getDoc(doc(this.firestore, `users/${post['author']}`));
        const authorData = authorDoc.data();
        return {
          ...post,
          createdAt: post['createdAt'] ? (post['createdAt'] as Timestamp).toDate() : undefined,
          authorName: authorData?.['username'] || authorData?.['email'] || 'Unknown user'
        } as Post;
      }))))
    );
  }

  getTopic(topicId: string): Observable<Topic> {
    const topicRef = doc(this.firestore, `topics/${topicId}`);
    return docData(topicRef, { idField: 'id' }).pipe(
      switchMap(async topic => {
        if (!topic) {
          throw new Error('Topic not found');
        }
        
        const topicData = topic as any;
        const ownerDoc = await getDoc(doc(this.firestore, `users/${topicData.owner}`));
        const ownerData = ownerDoc.data();
        
        // 确保版本号是数字类型
        const version = typeof topicData.version === 'number' ? topicData.version : 0;
        
        // 转换时间戳
        const updatedAt = topicData.updatedAt instanceof Timestamp 
          ? topicData.updatedAt.toDate() 
          : topicData.updatedAt;
        const createdAt = topicData.createdAt instanceof Timestamp 
          ? topicData.createdAt.toDate() 
          : topicData.createdAt;

        return {
          ...topicData,
          ownerName: ownerData?.['username'] || ownerData?.['email'] || 'Unknown user',
          version: version,
          updatedAt: updatedAt,
          createdAt: createdAt
        };
      })
    );
  }

  private getCurrentUser(): Promise<any> {
    return new Promise((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  private canAccessTopic(topic: Topic): boolean {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return false;
    
    // 简化访问检查逻辑
    return topic.owner === userId || 
           topic.editors?.includes(userId) || 
           topic.readers?.includes(userId);
  }

  canEditTopic(topic: Topic): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;
    
    // 检查是否是 owner 或 editor
    return topic.owner === userId || 
           (topic.editors && topic.editors.includes(userId));
  }

  async addReader(topicId: string, userEmail: string) {
    try {
      const userRecord = await this.userService.getUserByEmail(userEmail);
      if (!userRecord) throw new Error('User not found');

      const topicRef = doc(this.firestore, `topics/${topicId}`);
      const topicDoc = await getDoc(topicRef);
      
      if (!topicDoc.exists()) throw new Error('Topic not found');
      
      const topic = topicDoc.data() as Topic;
      if (topic.readers.includes(userRecord.uid)) {
        throw new Error('User is already a reader');
      }

      return updateDoc(topicRef, {
        readers: arrayUnion(userRecord.uid)
      });
    } catch (error) {
      console.error('Error adding reader:', error);
      throw error;
    }
  }

  async addEditor(topicId: string, userEmail: string) {
    try {
      const userRecord = await this.userService.getUserByEmail(userEmail);
      if (!userRecord) throw new Error('User not found');

      const topicRef = doc(this.firestore, `topics/${topicId}`);
      const topicDoc = await getDoc(topicRef);
      
      if (!topicDoc.exists()) throw new Error('Topic not found');
      
      const topic = topicDoc.data() as Topic;
      if (topic.editors.includes(userRecord.uid)) {
        throw new Error('User is already an editor');
      }

      return updateDoc(topicRef, {
        editors: arrayUnion(userRecord.uid)
      });
    } catch (error) {
      console.error('Error adding editor:', error);
      throw error;
    }
  }

  async removeUser(topicId: string, userId: string) {
    try {
      const topicRef = doc(this.firestore, `topics/${topicId}`);
      return updateDoc(topicRef, {
        readers: arrayRemove(userId),
        editors: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  }

  getTopicUsers(topicId: string): Observable<UserWithRole[]> {
    return this.getTopic(topicId).pipe(
      switchMap(async topic => {
        const users: UserWithRole[] = [];
        
        if (topic?.owner) {
          const ownerDoc = await getDoc(doc(this.firestore, `users/${topic.owner}`));
          const ownerData = ownerDoc.data();
          users.push({
            id: topic.owner,
            email: ownerData?.['username'] || ownerData?.['email'] || 'Unknown user',
            role: 'owner'
          });
        }

        await Promise.all([
          ...topic.editors?.map(async editorId => {
            const editorDoc = await getDoc(doc(this.firestore, `users/${editorId}`));
            const editorData = editorDoc.data();
            users.push({
              id: editorId,
              email: editorData?.['username'] || editorData?.['email'] || 'Unknown editor',
              role: 'editor'
            });
          }) || [],
          ...topic.readers?.map(async readerId => {
            const readerDoc = await getDoc(doc(this.firestore, `users/${readerId}`));
            const readerData = readerDoc.data();
            users.push({
              id: readerId,
              email: readerData?.['username'] || readerData?.['email'] || 'Unknown reader',
              role: 'reader'
            });
          }) || []
        ]);

        return users;
      }),
      map(users => users.filter(user => user.email !== 'unknown'))
    );
  }

  getCurrentUserId(): string | undefined {
    return this.auth.currentUser?.uid;
  }

  isOwner(topic: Topic): boolean {
    const userId = this.getCurrentUserId();
    return userId ? topic.owner === userId : false;
  }
}
