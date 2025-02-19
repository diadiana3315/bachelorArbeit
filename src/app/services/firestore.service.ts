import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {combineLatest, Observable} from 'rxjs';
import {FileMetadata} from '../models/file-metadata';
import { map } from 'rxjs/operators';
import {FirebaseStorageService} from './firebase-storage.service';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore, private storageService: FirebaseStorageService){}

  // Save file metadata to Firestore
  async saveFileMetadata(fileMetadata: FileMetadata): Promise<void> {
    try {
      const fileId = fileMetadata.id; // Assuming fileMetadata.id is a unique file ID

      await this.firestore
        .collection('users')
        .doc(fileMetadata.userId)
        .collection('files')
        .doc(fileId)
        .set(fileMetadata);
      console.log('File metadata saved successfully');
    } catch (error) {
      console.error('Error saving file metadata:', error);
      throw error;
    }
  }

  // Delete file and its metadata
  async deleteFile(userId: string, fileId: string): Promise<void> {
    const filePath = `${userId}/${fileId}`; // Matches Firebase Storage structure: username/filename


    try {
      // Step 1: Delete the file from Firebase Storage
      await this.storageService.deleteFile(filePath);

      // Step 2: Delete the file metadata from Firestore
      await this.firestore
        .collection('users')
        .doc(userId)
        .collection('files')
        .doc(fileId)
        .delete();
      console.log('File metadata deleted from Firestore');
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Method for uploading and saving file metadata
  async uploadAndSaveFile(file: File, parentFolderId: string | null, userId: string): Promise<FileMetadata> {
    const fileId = `${userId}_${Date.now()}`;
    const filePath = `${userId}/${fileId}`; // Use the actual filename in the file path

    try {
      const downloadURL = await this.storageService.uploadFile(file, filePath);

      const fileMetadata: FileMetadata = {
        fileURL: downloadURL,
        fileName: file.name,
        fileType: file.type,
        parentFolderId: parentFolderId,
        userId: userId,
        id: fileId, // Path as the file ID
      };

      await this.saveFileMetadata(fileMetadata);

      return fileMetadata; // Return file metadata
    } catch (error) {
      console.error('Error uploading and saving file:', error);
      throw error;
    }
  }


  /**
   * Saves a folder to Firestore under the user's folder collection.
   * @param folder The folder object to save.
   */
  createFolder(folder: any): Promise<void> {
    const folderRef = this.firestore.collection('users')
      .doc(folder.userId)
      .collection('folders');

    return folderRef.add(folder).then(() => {
      console.log('Folder successfully saved to Firestore');
    }).catch(error => {
      console.error('Error saving folder to Firestore:', error);
    });
  }


  /**
   * Retrieves all folders and files for a user, optionally filtered by a parent folder ID.
   * Combines the results of two Firestore queries (for folders and files) into a single observable.
   * @param userId The ID of the user whose folders and files to retrieve.
   * @param parentFolderId (Optional) The ID of the parent folder to filter the results.
   * @returns An observable that emits an object containing the list of folders and files.
   */
  getFoldersAndFiles(userId: string, parentFolderId: string | null = null): Observable<any> {
    const folders$ = this.firestore
      .collection(`users/${userId}/folders`, ref => ref.where('parentFolderId', '==', parentFolderId))
      .snapshotChanges();

    const files$ = this.firestore
      .collection(`users/${userId}/files`, ref => ref.where('parentFolderId', '==', parentFolderId))
      .snapshotChanges();

    return combineLatest([folders$, files$]).pipe(
      map(([foldersSnapshot, filesSnapshot]) => ({
        folders: foldersSnapshot.map(doc => ({
          id: doc.payload.doc.id,
          ...(doc.payload.doc.data() ?? {})
        })),
        files: filesSnapshot.map(doc => ({
          id: doc.payload.doc.id,
          ...(doc.payload.doc.data() ?? {})
        }))
      }))
    );
  }

  /**
   * Recursively deletes a folder and its contents (files and subfolders) from Firestore.
   * @param userId The ID of the user who owns the folder.
   * @param folderId The ID of the folder to delete.
   * @returns A promise that resolves when the folder and all its contents have been deleted.
   */
  async deleteFolderRecursively(userId: string, folderId: string): Promise<void> {
    const folderRef = this.firestore.collection(`users/${userId}/folders`).doc(folderId);

    // Get subfolders
    const subfoldersSnapshot = await this.firestore
      .collection(`users/${userId}/folders`, ref => ref.where('parentFolderId', '==', folderId))
      .get().toPromise();

    // Get files inside the folder
    const filesSnapshot = await this.firestore
      .collection(`users/${userId}/files`, ref => ref.where('parentFolderId', '==', folderId))
      .get().toPromise();

    // Recursively delete all subfolders
    for (const doc of subfoldersSnapshot?.docs || []) {
      await this.deleteFolderRecursively(userId, doc.id);
    }

    // Delete all files inside the folder
    for (const doc of filesSnapshot?.docs || []) {
      await this.firestore.collection(`users/${userId}/files`).doc(doc.id).delete();
    }

    // Finally, delete the folder itself
    await folderRef.delete();
  }

}
