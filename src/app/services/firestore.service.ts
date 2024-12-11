import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore){
  }

  saveFolder(folder: any) {
    const folderRef = this.firestore.collection('users').doc(folder.userId).collection('folders');
    folderRef.add(folder);
  }

  saveFileMetadata(fileMetadata: any) {
    const fileRef = this.firestore.collection('users').doc(fileMetadata.userId).collection('files');
    fileRef.add(fileMetadata);
  }


  // Fetch all folders and files
  getFoldersAndFiles(userId: string): Observable<any> {
    // Firestore query to get folders and files as an observable
    const foldersObservable = this.firestore
      .collection('users')
      .doc(userId)
      .collection('folders')
      .snapshotChanges();  // snapshotChanges gives an observable

    const filesObservable = this.firestore
      .collection('users')
      .doc(userId)
      .collection('files')
      .snapshotChanges();  // snapshotChanges gives an observable

    // Combine both observables into one object and return it as an observable
    return new Observable(observer => {
      foldersObservable.subscribe(foldersSnapshot => {
        filesObservable.subscribe(filesSnapshot => {
          const folders = foldersSnapshot.map(doc => doc.payload.doc.data());
          const files = filesSnapshot.map(doc => doc.payload.doc.data());

          observer.next({ folders, files });
          observer.complete();
        });
      });
    });
  }
}
