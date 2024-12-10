import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore) {}

  // Add file metadata (URL, file name, etc.) to Firestore
  addFileMetadata(fileMetadata: any) {
    const userId = 'currentUserId';  // Replace with actual user ID (from Firebase Auth)
    const folderId = fileMetadata.folderId || 'root';  // If no folder, use root

    return this.firestore.collection('users').doc(userId).collection('folders').doc(folderId).collection('files').add(fileMetadata);
  }
}
