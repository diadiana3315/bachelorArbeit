import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {AngularFireAuth} from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: AngularFirestore, private afAuth: AngularFireAuth) {}

  /**
   * Saves user data to Firestore under the 'users' collection.
   * If the document with the given userId doesn't exist, it will be created.
   * If it exists, it will be overwritten with the provided data.
   * @param userId The unique identifier for the user (UID).
   * @param data The data to save for the user.
   * @returns A promise indicating the success or failure of the save operation.
   */
  saveUser(userId: string, data: any) {
    return this.firestore.collection('users').doc(userId).set({
      ...data,
      lastLogin: new Date().toISOString() // Store last login during registration
    }, { merge: true });
  }

  /**
   * Retrieves user data from Firestore based on the provided user ID (UID).
   * @param userId The unique identifier for the user (UID).
   * @returns A promise with the user document snapshot from Firestore.
   */
  getUser(userId: string) {
    return this.firestore.collection('users').doc(userId).get();
  }

  /**
   * Get the current user's ID asynchronously from Firebase Authentication.
   * This method retrieves the authenticated user's ID and returns it as a string.
   * @returns The current user's ID if authenticated, else an empty string.
   */
  async getCurrentUserId(): Promise<string> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : '';  // Return the user UID
  }

  /**
   * Updates user data in Firestore.
   * @param userId The unique user ID.
   * @param data The new user data.
   * @returns A promise indicating success or failure.
   */
  updateUser(userId: string, data: any) {
    return this.firestore.collection('users').doc(userId).update(data);
  }

  /**
   * Updates the user's email in Firebase Authentication.
   * @param newEmail The new email address.
   * @returns A promise indicating success or failure.
   */
  async updateEmail(newEmail: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      await user.updateEmail(newEmail);
    }
  }

  /**
   * Updates the user's password in Firebase Authentication.
   * @param newPassword The new password.
   * @returns A promise indicating success or failure.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      await user.updatePassword(newPassword);
    }
  }

  /**
   * Updates the user's last login time in Firestore.
   * This is called each time the user logs in.
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.firestore.collection('users').doc(userId).update({
      lastLogin: new Date().toISOString()
    });
  }
}
