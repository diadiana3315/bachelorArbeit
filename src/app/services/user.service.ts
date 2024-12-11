import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: AngularFirestore) {}

  // Save user to Firestore
  saveUser(userId: string, data: any) {
    return this.firestore.collection('users').doc(userId).set(data);
  }

  // Get user data by UID
  getUser(userId: string) {
    return this.firestore.collection('users').doc(userId).get();
  }
}
