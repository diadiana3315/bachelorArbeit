import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {AngularFireStorage} from '@angular/fire/compat/storage';
import {FirestoreService} from '../services/firestore.service';

@Component({
  selector: 'app-add-button',
  templateUrl: './add-button.component.html',
  styleUrl: './add-button.component.css'
})
export class AddButtonComponent {
  @Input() currentFolder: any = null;  // Folder context for creating a folder
  @Output() folderCreated = new EventEmitter<any>();  // Event when a folder is created
  @Output() fileUploaded = new EventEmitter<any>();  // Event when a file is uploaded

  @ViewChild('fileInput') fileInput: any;
  @ViewChild('imageInput') imageInput: any;

  constructor(
    private firestoreService: FirestoreService,  // Custom service for Firestore operations
    private storage: AngularFireStorage         // Firebase Storage service
  ) {}


  // Create Folder action
  createFolder() {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      const newFolder = {
        name: folderName,
        folders: [],  // Add subfolder support
        files: []  // Empty file array initially
      };
      if (this.currentFolder) {
        // If inside a folder, create the folder as a child
        this.currentFolder.folders.push(newFolder);
      } else {
        // Otherwise, create it at the root level
        this.folderCreated.emit(newFolder);
      }
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
      this.uploadToFirebaseStorage(file, 'pdf');  // Specify the file type (e.g., 'pdf')
    }
  }

  // On Image Selected
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadToFirebaseStorage(file, 'jpg');  // Specify the file type (e.g., 'image')
    }
  }

  // Upload file to Firebase Storage and save URL to Firestore
  private uploadToFirebaseStorage(file: File, fileType: string) {
    const filePath = `uploads/${fileType}/${Date.now()}_${file.name}`; // Generate a unique path
    const fileRef = this.storage.ref(filePath);

    // Upload the file to Firebase Storage
    const uploadTask = this.storage.upload(filePath, file);

    // Get the URL of the uploaded file once it's completed
    uploadTask.snapshotChanges().toPromise().then(() => {
      fileRef.getDownloadURL().toPromise().then((downloadURL) => {
        this.saveFileMetadataToFirestore(downloadURL, file.name, fileType); // Save file metadata to Firestore
      });
    });
  }

  // Save file metadata (URL, file name) to Firestore
  private saveFileMetadataToFirestore(fileURL: string, fileName: string, fileType: string) {
    const fileMetadata = {
      fileURL,
      fileName,
      fileType,
      folderId: this.currentFolder ? this.currentFolder.id : null // If in a folder, associate with folderId
    };

    this.fileUploaded.emit(fileMetadata);
  }
}
