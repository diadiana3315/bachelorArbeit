import { Injectable } from '@angular/core';
import {AngularFirestore, DocumentChangeAction} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
import {FileMetadata} from '../models/file-metadata';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore){
  }

  saveFolder(folder: any) {
    const folderRef = this.firestore.collection('users')
      .doc(folder.userId)
      .collection('folders');
    folderRef.add(folder).then(() => {
      console.log('Folder successfully saved to Firestore');
    }).catch(error => {
      console.error('Error saving folder to Firestore:', error);
    });
  }

  saveFileMetadata(fileMetadata: any) {
    const fileRef = this.firestore.collection('users').doc(fileMetadata.userId).collection('files');
    return fileRef.add(fileMetadata)  // Return the promise so it can be chained
      .then(() => {
        console.log('File successfully saved:', fileMetadata);
      })
      .catch(error => {
        console.error('Error saving file metadata to Firestore:', error);
        throw error;  // Re-throw the error to be handled in the caller
      });
  }



  // Fetch all folders and files
  getFoldersAndFiles(userId: string): Observable<any> {
    // Firestore query to get folders and files as an observable
    const foldersObservable = this.firestore
      .collection('users')
      .doc(userId)
      .collection('folders', ref => ref.where('parentFolderId', '==', null)) // Filter by parentFolderId
      .snapshotChanges();  // snapshotChanges gives an observable

    const filesObservable = this.firestore
      .collection('users')
      .doc(userId)
      .collection('files', ref => ref.where('parentFolderId', '==', null)) // Filter by parentFolderId
      .snapshotChanges();  // snapshotChanges gives an observable

    // Combine both observables into one object and return it as an observable
    return this.combineObservables(foldersObservable, filesObservable);

  }

  getFoldersAndFilesByParentId(userId: string, parentFolderId: string): Observable<any> {
    const foldersObservable = this.firestore
      .collection('users')
      .doc(userId)
      .collection('folders', ref => ref.where('parentFolderId', '==', parentFolderId))
      .snapshotChanges();

    const filesObservable = this.firestore
      .collection('users')
      .doc(userId)
      .collection('files', ref => ref.where('parentFolderId', '==', parentFolderId))
      .snapshotChanges();

    return this.combineObservables(foldersObservable, filesObservable);
  }

  private combineObservables(
    foldersObservable: Observable<DocumentChangeAction<any>[]>,
    filesObservable: Observable<DocumentChangeAction<any>[]>
  ): Observable<any> {
    return new Observable(observer => {
      foldersObservable.subscribe((foldersSnapshot: DocumentChangeAction<any>[]) => {
        filesObservable.subscribe((filesSnapshot: DocumentChangeAction<any>[]) => {
          const folders = foldersSnapshot.map((doc: DocumentChangeAction<any>) => ({
            id: doc.payload.doc.id,  // Include document ID
            ...doc.payload.doc.data() // Spread document data
          }));

          const files = filesSnapshot.map((doc: DocumentChangeAction<any>) => ({
            id: doc.payload.doc.id,  // Include document ID
            ...doc.payload.doc.data()
          }));
          observer.next({ folders, files });
          observer.complete();
        });
      });
    });
  }

  deleteFile(file: FileMetadata): Promise<void> {
    return this.firestore.collection('files').doc(file.id).delete();
  }

}
