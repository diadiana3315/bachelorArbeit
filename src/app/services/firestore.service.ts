import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {combineLatest, firstValueFrom, Observable} from 'rxjs';
import {FileMetadata} from '../models/file-metadata';
import { map } from 'rxjs/operators';
import {FirebaseStorageService} from './firebase-storage.service';
import {Folder} from '../models/folder';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


export interface Practice {
  day: string;
  duration: number;
}


export interface UserDocument {
  practiceHistory?: {
    weekStart: string; // Store the week start date
    practices: Practice[]; // Array of practice sessions for the week
    streakCount: number; // Streak count for consecutive weeks
  }[];
  practiceGoals?: {
    timesPerWeek: number;
    duration: number;
    selectedDays: string[];
  };
}


@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore, private storageService: FirebaseStorageService) {
  }

  // Save file metadata to Firestore
  async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    const { id, userId, isShared, parentFolderId } = metadata;

    if (!id) {
      throw new Error('File ID is missing');
    }

    if (isShared && parentFolderId) {
      // Save under shared structure
      return this.firestore
        .collection('folders')
        .doc(parentFolderId)
        .collection('files')
        .doc(id)
        .set(metadata);
    }

    // Default to private user file
    return this.firestore
      .collection('users')
      .doc(userId)
      .collection('files')
      .doc(id)
      .set(metadata);
  }


  // Delete file and its metadata
  async deleteFile(
    userId: string,
    fileId: string,
    isShared: boolean = false,
    parentFolderId?: string
  ): Promise<void> {
    let filePath: string;

    if (isShared) {
      if (!parentFolderId) {
        throw new Error('parentFolderId is required for shared files');
      }
      filePath = `shared/${parentFolderId}/${fileId}`;
    } else {
      filePath = `${userId}/${fileId}`; // Private file path
    }

    try {
      // Step 1: Delete the file from Firebase Storage
      await this.storageService.deleteFile(filePath);

      // Step 2: Delete the metadata from Firestore
      if (isShared) {
        await this.firestore
          .collection('folders')
          .doc(parentFolderId)
          .collection('files')
          .doc(fileId)
          .delete();
      } else {
        await this.firestore
          .collection('users')
          .doc(userId)
          .collection('files')
          .doc(fileId)
          .delete();
      }

      console.log('File metadata deleted from Firestore');
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }


  // Method for uploading and saving file metadata
  // async uploadAndSaveFile(file: File, parentFolderId: string | null, userId: string): Promise<FileMetadata> {
  //   const fileId = `${userId}_${Date.now()}`;
  //   const filePath = `${userId}/${fileId}`; // Use the actual filename in the file path
  //
  //   try {
  //     const downloadURL = await this.storageService.uploadFile(file, filePath);
  //
  //     const fileMetadata: FileMetadata = {
  //       fileURL: downloadURL,
  //       fileName: file.name,
  //       fileType: file.type,
  //       parentFolderId: parentFolderId,
  //       userId: userId,
  //       id: fileId, // Path as the file ID
  //     };
  //
  //     await this.saveFileMetadata(fileMetadata);
  //
  //     return fileMetadata; // Return file metadata
  //   } catch (error) {
  //     console.error('Error uploading and saving file:', error);
  //     throw error;
  //   }
  // }

  async uploadAndSaveFile(
    file: File,
    parentFolder: any, // Pass the entire folder object here
    userId: string
  ): Promise<FileMetadata> {
    const fileId = `${userId}_${Date.now()}`;
    const filePath = `${userId}/${fileId}`; // For Firebase Storage

    try {
      const downloadURL = await this.storageService.uploadFile(file, filePath);

      const fileMetadata: FileMetadata = {
        fileURL: downloadURL,
        fileName: file.name,
        fileType: file.type,
        parentFolderId: parentFolder ? parentFolder.id : null,
        userId: userId,
        id: fileId,
        isShared: parentFolder ? parentFolder.isShared : false, // Check if the folder is shared
      };

      if (parentFolder && parentFolder.isShared) {
        // Store under shared folders collection
        await this.firestore
          .collection(`folders/${parentFolder.id}/files`)
          .doc(fileId)
          .set(fileMetadata);
      } else {
        // Default to private storage
        await this.firestore
          .collection(`users/${userId}/files`)
          .doc(fileId)
          .set(fileMetadata);
      }

      console.log('File metadata saved successfully');
      return fileMetadata;
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
  async deleteFolderRecursively(userId: string, folderId: string, isShared: boolean = false): Promise<void> {
    if (isShared) {
      const folderRef = this.firestore.collection('folders').doc(folderId);

      // Get subfolders of the shared folder
      const subfoldersSnapshot = await this.firestore
        .collection(`folders/${folderId}/folders`)
        .get()
        .toPromise();

      // Get files inside the shared folder
      const filesSnapshot = await this.firestore
        .collection(`folders/${folderId}/files`)
        .get()
        .toPromise();

      // Recursively delete all subfolders inside shared folder
      for (const doc of subfoldersSnapshot?.docs || []) {
        await this.deleteFolderRecursively(userId, doc.id, true);
      }

      // Delete all files inside the shared folder
      for (const doc of filesSnapshot?.docs || []) {
        // Also delete file from storage here if needed
        await this.firestore.collection(`folders/${folderId}/files`).doc(doc.id).delete();
      }

      // Finally, delete the shared folder itself
      await folderRef.delete();
    } else {
      // Private folder deletion (existing logic)
      const folderRef = this.firestore.collection(`users/${userId}/folders`).doc(folderId);

      // Get subfolders
      const subfoldersSnapshot = await this.firestore
        .collection(`users/${userId}/folders`, ref => ref.where('parentFolderId', '==', folderId))
        .get()
        .toPromise();

      // Get files inside the folder
      const filesSnapshot = await this.firestore
        .collection(`users/${userId}/files`, ref => ref.where('parentFolderId', '==', folderId))
        .get()
        .toPromise();

      // Recursively delete all subfolders
      for (const doc of subfoldersSnapshot?.docs || []) {
        await this.deleteFolderRecursively(userId, doc.id, false);
      }

      // Delete all files inside the folder
      for (const doc of filesSnapshot?.docs || []) {
        await this.firestore.collection(`users/${userId}/files`).doc(doc.id).delete();
      }

      // Finally, delete the folder itself
      await folderRef.delete();
    }
  }

  /**
   * Retrieves file metadata by file URL.
   * @param fileURL The file URL to search for in Firestore.
   * @param userId The userId of the current user.
   * @returns The file metadata if found.
   */
  async getFileMetadataByUrl(fileURL: string, userId: string): Promise<FileMetadata | null> {
    try {
      // 1. Check private user files
      const privateFileRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('files', (ref) => ref.where('fileURL', '==', fileURL));

      const privateSnapshot = await privateFileRef.get().toPromise();

      if (privateSnapshot && !privateSnapshot.empty && privateSnapshot.docs.length > 0) {
        const fileDoc = privateSnapshot.docs[0];
        const fileData = fileDoc.data();
        if (fileData) {
          return { id: fileDoc.id, ...fileData } as FileMetadata;
        }
      }

      // 2. Search shared folders
      const foldersSnapshot = await this.firestore.collection('folders').get().toPromise();

      if (foldersSnapshot && !foldersSnapshot.empty) {
        for (const folderDoc of foldersSnapshot.docs) {
          const folderId = folderDoc.id;

          const sharedFileRef = this.firestore
            .collection(`folders/${folderId}/files`, (ref) => ref.where('fileURL', '==', fileURL));

          const sharedSnapshot = await sharedFileRef.get().toPromise();

          if (sharedSnapshot && !sharedSnapshot.empty && sharedSnapshot.docs.length > 0) {
            const sharedFileDoc = sharedSnapshot.docs[0];
            const sharedFileData = sharedFileDoc.data();
            if (sharedFileData) {
              return { id: sharedFileDoc.id, ...sharedFileData } as FileMetadata;
            }
          }
        }
      }

      // Not found
      return null;
    } catch (error) {
      console.error('Error fetching file metadata by URL:', error);
      return null;
    }
  }



  // getAllFilesAndFolders(userId: string) {
  //   return this.firestore.collection(`users/${userId}/files`).valueChanges().pipe(
  //     map(files => {
  //       return {
  //         files: files as FileMetadata[],
  //         folders: this.getAllFolders(userId) // Fetch all folders
  //       };
  //     })
  //   );
  // }

  // getAllFolders(userId: string) {
  //   return this.firestore.collection(`users/${userId}/folders`).valueChanges();
  // }
  //
  // async updateFileAccessTimestamp(userId: string, fileId: string): Promise<void> {
  //   try {
  //     await this.firestore
  //       .collection('users')
  //       .doc(userId)
  //       .collection('files')
  //       .doc(fileId)
  //       .update({
  //         lastAccessedAt: Date.now()
  //       });
  //     console.log('File access timestamp updated');
  //   } catch (error) {
  //     console.error('Error updating file access timestamp:', error);
  //     throw error;
  //   }
  // }

  updateUserPracticeGoals(userId: string, practiceGoals: any): Promise<void> {
    return this.firestore.collection('users').doc(userId).update({practiceGoals});
  }

  getUserPracticeGoals(userId: string): Observable<UserDocument['practiceGoals']> {
    return this.firestore.collection<UserDocument>('users').doc(userId).valueChanges().pipe(
      map(userDoc => userDoc?.practiceGoals ?? {
        goalType: 'timesPerWeek',
        timesPerWeek: 3,
        duration: 30,
        selectedDays: []
      })
    );
  }

//   getUserStreak(userId: string) {
//     return this.firestore.collection('users').doc(userId).valueChanges().pipe(
//       map((userDoc: unknown) => {
//         // Check if the userDoc is of the correct type
//         if (this.isUserDocument(userDoc)) {
//           return userDoc.practiceHistory || [];
//         }
//         return [];
//       })
//     );
//   }
//
// // Type guard function to check if it's a UserDocument
//   private isUserDocument(userDoc: any): userDoc is UserDocument {
//     return userDoc && Array.isArray(userDoc.practiceHistory);
//   }

  // // Save updated streak and practice data
  // updateUserStreak(userId: string, streakData: any) {
  //   return this.firestore.collection('users').doc(userId).update({ practiceHistory: streakData });
  // }

  updateFileName(userId: string, fileId: string, newName: string, isShared: boolean = false, parentFolderId?: string): Promise<void> {
    if (!fileId) {
      return Promise.reject('File ID is undefined');
    }

    console.log('Updating file with ID:', fileId);

    let fileRef;

    if (isShared) {
      if (!parentFolderId) {
        return Promise.reject('Shared file requires parentFolderId');
      }

      fileRef = this.firestore
        .collection('folders')
        .doc(parentFolderId)
        .collection('files')
        .doc(fileId);
    } else {
      fileRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('files')
        .doc(fileId);
    }

    return fileRef.get().toPromise().then((doc) => {
      if (!doc || !doc.exists) {
        console.error('Firestore: No document found for ID:', fileId);
        return Promise.reject('No document found with this ID');
      }

      return fileRef.update({ fileName: newName });
    });
  }


  logUserUsage(userId: string) {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // Format YYYY-MM-DD

    const usageRef = this.firestore.collection(`users/${userId}/usageRecords`).doc(dateString);

    return usageRef.set({used: true}, {merge: true});
  }


  async getUserUsageDays(userId: string): Promise<Set<string>> {
    const usageRecords = await this.firestore.collection(`users/${userId}/usageRecords`).get().toPromise();

    if (!usageRecords || usageRecords.empty) {
      return new Set(); // Return an empty set if there are no records
    }

    const usedDays = new Set<string>();

    usageRecords.forEach(doc => {
      if (doc.id) {
        usedDays.add(doc.id); // Store full date (YYYY-MM-DD)
      }
    });

    return usedDays;
  }

  async getFolderByNameAndParent(name: string, userId: string, parentFolderId: string | null): Promise<Folder | null> {
    const folderRef = this.firestore.collection(`users/${userId}/folders`, ref =>
      ref.where('name', '==', name).where('parentFolderId', '==', parentFolderId)
    );

    const snapshot = await folderRef.get().toPromise();

    if (!snapshot || snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0]; // Now safe to access
    const docData = doc.data();

    if (typeof docData === 'object' && docData !== null) {
      return {id: doc.id, ...docData} as Folder;
    }
    return null;
  }


// // Get all folders accessible by a user (both owned and shared)
//   getAccessibleFolders(userId: string, parentFolderId: string | null = null): Observable<Folder[]> {
//     // Get user's own folders
//     const ownFolders$ = this.firestore
//       .collection(`users/${userId}/folders`, ref =>
//         ref.where('parentFolderId', '==', parentFolderId)
//       )
//       .snapshotChanges()
//       .pipe(
//         map(actions => actions.map(a => ({
//           id: a.payload.doc.id,
//           ...a.payload.doc.data() as Folder
//         })))
//       );
//
//     // Get folders shared with this user
//     const sharedFolders$ = this.firestore
//       .collectionGroup('folders', ref =>
//         ref.where('sharedWith', 'array-contains', userId)
//           .where('parentFolderId', '==', parentFolderId)
//       )
//       .snapshotChanges()
//       .pipe(
//         map(actions => actions.map(a => ({
//           id: a.payload.doc.id,
//           ...a.payload.doc.data() as Folder,
//           isShared: true // Mark as shared
//         })))
//       );
//
//     return combineLatest([ownFolders$, sharedFolders$]).pipe(
//       map(([ownFolders, sharedFolders]) => [...ownFolders, ...sharedFolders])
//     );
//   }
//
// // Get all files accessible by a user (including those in shared folders)
//   getAccessibleFiles(userId: string, parentFolderId: string | null = null): Observable<FileMetadata[]> {
//     return this.firestore
//       .collectionGroup('files', ref =>
//         ref.where('parentFolderId', '==', parentFolderId)
//       )
//       .snapshotChanges()
//       .pipe(
//         map(actions => actions.map(a => ({
//           id: a.payload.doc.id,
//           ...a.payload.doc.data() as FileMetadata
//         })))
//       );
//   }
//
//
//   createSharedFolder(folder: Folder): Promise<void> {
//     const folderData = {
//       ...folder,
//       isShared: true,
//       createdAt: folder.createdAt || new Date()
//     };
//
//     return this.firestore.collection('folders')
//       .add(folderData)
//       .then(() => {
//         console.log('Shared folder saved to Firestore');
//       })
//       .catch(error => {
//         console.error('Error saving shared folder:', error);
//       });
//   }
//
//   getFilesForSharedFolders(sharedFolders: Folder[]): Observable<FileMetadata[]> {
//     const fileObservables = sharedFolders.map(folder =>
//       this.firestore
//         .collection<FileMetadata>(`folders/${folder.id}/files`)
//         .snapshotChanges()
//         .pipe(
//           map(actions => actions.map(a => ({
//             id: a.payload.doc.id,
//             ...a.payload.doc.data() as FileMetadata
//           })))
//         )
//     );
//
//     return combineLatest(fileObservables).pipe(
//       map(fileGroups => fileGroups.flat()) // Flatten array of arrays
//     );
//   }


  // Create a shared folder
  async createSharedFolder(folder: Folder): Promise<void> {
    const sharedFolder: Folder = {
      ...folder,
      isShared: true,
    };

    return this.firestore.collection('folders').doc(folder.id).set(sharedFolder);
  }


// Get all shared folders where user is involved
  getSharedFolders(userId: string): Observable<Folder[]> {
    const sharedWith$ = this.firestore.collection<Folder>('folders', ref =>
      ref.where('sharedWith', 'array-contains', userId)
    ).valueChanges({ idField: 'id' });

    const createdBy$ = this.firestore.collection<Folder>('folders', ref =>
      ref.where('userId', '==', userId).where('isShared', '==', true)
    ).valueChanges({ idField: 'id' });

    return combineLatest([sharedWith$, createdBy$]).pipe(
      map(([sharedWith, createdBy]) => {
        // Merge and deduplicate by folder ID
        const all = [...sharedWith, ...createdBy];
        const unique = new Map<string, Folder>();
        all.forEach(folder => unique.set(folder.id, folder));
        return Array.from(unique.values());
      })
    );
  }


// Upload file to shared folder
  async uploadFileToSharedFolder(file: File, folderId: string, userId: string): Promise<FileMetadata> {
    const fileId = `${userId}_${Date.now()}`;
    const path = `shared/${folderId}/${fileId}`; // optional: or just `${folderId}/${fileId}`
    const downloadURL = await this.storageService.uploadFile(file, path);

    const fileMetadata: FileMetadata = {
      id: fileId,
      fileName: file.name,
      fileURL: downloadURL,
      fileType: file.type,
      parentFolderId: folderId,
      userId,
      isShared: true
    };

    await this.firestore.collection(`folders/${folderId}/files`).doc(fileId).set(fileMetadata);
    return fileMetadata;
  }

// Get files in shared folder
  getSharedFolderFiles(folderId: string): Observable<FileMetadata[]> {
    return this.firestore.collection<FileMetadata>(`folders/${folderId}/files`).valueChanges({ idField: 'id' });
  }

// Delete shared file
  async deleteSharedFile(folderId: string, fileId: string): Promise<void> {
    await this.storageService.deleteFile(`shared/${folderId}/${fileId}`);
    return this.firestore.collection(`folders/${folderId}/files`).doc(fileId).delete();
  }

  // Get subfolders + files for a shared folder
  getSharedFolderContents(folderId: string): Observable<{ folders: Folder[], files: FileMetadata[] }> {
    const folders$ = this.firestore.collection<Folder>('folders', ref =>
      ref.where('parentFolderId', '==', folderId)
    ).valueChanges({ idField: 'id' });

    const files$ = this.firestore.collection<FileMetadata>(`folders/${folderId}/files`)
      .valueChanges({ idField: 'id' });

    return combineLatest([folders$, files$]).pipe(
      map(([folders, files]) => ({ folders, files }))
    );
  }

}
