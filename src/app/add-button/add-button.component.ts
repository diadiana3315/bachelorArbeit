// Corrected code with .then() approach
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FirestoreService } from '../services/firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-add-button',
  templateUrl: './add-button.component.html',
  styleUrls: ['./add-button.component.css']
})
export class AddButtonComponent {
  @Input() currentFolder: any = null;
  @Output() folderCreated = new EventEmitter<any>();
  @Output() fileUploaded = new EventEmitter<any>();

  @ViewChild('fileInput') fileInput: any;
  @ViewChild('imageInput') imageInput: any;

  constructor(
    private firestoreService: FirestoreService,
    private storage: AngularFireStorage,
    private afAuth: AngularFireAuth
  ) {}

  // Get the current user ID using .then()
  private getCurrentUserId(): string {
    let userId = '';
    this.afAuth.currentUser.then(user => {
      userId = user ? user.uid : ''; // If user exists, get uid
    });
    return userId;
  }

  // Create Folder action
  createFolder() {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      this.afAuth.currentUser.then(user => {
        const userId = user ? user.uid : '';  // Get user ID
        const newFolder = {
          name: folderName,
          folders: [],
          files: [],
          parentFolderId: this.currentFolder ? this.currentFolder.id : null,
          userId: userId
        };
        if (this.currentFolder) {
          this.currentFolder.folders.push(newFolder);
        } else {
          this.folderCreated.emit(newFolder);
        }
        this.firestoreService.saveFolder(newFolder);
      });
    }
  }

  // Handle PDF Upload
  uploadPDF() {
    this.fileInput.nativeElement.click();
  }

  // Handle Image Upload
  uploadPhoto() {
    this.imageInput.nativeElement.click();
  }

  // On File Selected
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadToFirebaseStorage(file, 'pdf');
    }
  }

  // On Image Selected
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadToFirebaseStorage(file, 'jpg');
    }
  }

  // Upload file to Firebase Storage and save URL to Firestore
  private uploadToFirebaseStorage(file: File, fileType: string) {
    const filePath = `uploads/${fileType}/${Date.now()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);

    uploadTask.snapshotChanges().toPromise().then(() => {
      fileRef.getDownloadURL().toPromise().then((downloadURL) => {
        this.saveFileMetadataToFirestore(downloadURL, file.name, fileType);
      });
    });
  }

  private saveFileMetadataToFirestore(fileURL: string, fileName: string, fileType: string) {
    this.afAuth.currentUser.then(user => {
      const userId = user ? user.uid : '';
      const fileMetadata = {
        fileURL,
        fileName,
        fileType,
        parentFolderId: this.currentFolder ? this.currentFolder.id : null,
        userId
      };
      this.fileUploaded.emit(fileMetadata);
      this.firestoreService.saveFileMetadata(fileMetadata);
    });
  }
}
