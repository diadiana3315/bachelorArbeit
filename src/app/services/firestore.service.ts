import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {combineLatest, map} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore) {
  }

  // Add file metadata to Firestore
  addFileMetadata(fileMetadata: any) {
    return this.firestore.collection('files').add(fileMetadata);
  }

  // Add folder metadata to Firestore
  addFolderMetadata(folderMetadata: any) {
    return this.firestore.collection('folders').add(folderMetadata);
  }

  // Fetch all folders and files
  getFoldersAndFiles(parentFolderId: string | null = null) {
    const folderQuery = this.firestore
      .collection('folders', (ref) =>
        parentFolderId ? ref.where('parentFolderId', '==', parentFolderId) : ref
      )
      .snapshotChanges()
      .pipe(
        map((folders: any) =>
          folders.map((folder: any) => ({
            id: folder.payload.doc.id,
            ...folder.payload.doc.data(),
          }))
        )
      );

    const fileQuery = this.firestore
      .collection('files', (ref) =>
        parentFolderId ? ref.where('folderId', '==', parentFolderId) : ref
      )
      .snapshotChanges()
      .pipe(
        map((files: any) =>
          files.map((file: any) => ({
            id: file.payload.doc.id,
            ...file.payload.doc.data(),
          }))
        )
      );

    return combineLatest([folderQuery, fileQuery]).pipe(
      map(([folders, files]) => ({folders, files}))
    );
  }
}
