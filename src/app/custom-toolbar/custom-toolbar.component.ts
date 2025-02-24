import {AfterViewInit, Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {FileViewerComponent} from '../file-viewer/file-viewer.component';
import {AngularFireStorage} from '@angular/fire/compat/storage';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {finalize} from 'rxjs';
import {FileMetadata} from '../models/file-metadata';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {FirestoreService} from '../services/firestore.service';
import {NgxExtendedPdfViewerService} from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-custom-toolbar',
  templateUrl: './custom-toolbar.component.html',
  styleUrl: './custom-toolbar.component.css'
})
export class CustomToolbarComponent {
  @Input() fileMetadata!: FileMetadata;

  public onClick?: () => void;

  constructor(private router: Router,
              private auth: AngularFireAuth,
              private firestoreService: FirestoreService,
              private storageService: FirebaseStorageService,
              private pdfViewerService: NgxExtendedPdfViewerService
  )
  { // Bind the `handleSaveToFirebase` method to the component's context
  this.onClick = this.handleSaveToFirebase.bind(this);
  }


  async savePdfToFirebase(blob: Blob) {
    const user = await this.auth.currentUser;
    if (!user) {
      console.error('No user logged in!');
      return;
    }

    if (!this.fileMetadata) {
      console.error('File metadata is missing!');
      return;
    }

    const { userId, id: fileId, fileName } = this.fileMetadata;
    const filePath = `${userId}/${fileId}`; // Path in Firebase Storage

    try {
      console.log('Uploading PDF to Firebase...');

      const downloadURL = await this.storageService.uploadFile(
        new File([blob], fileName, { type: 'application/pdf' }),
        filePath
      );

      if (!downloadURL) {
        console.error('Upload failed: No download URL returned.');
        return;
      }

      const updatedMetadata: FileMetadata = {
        ...this.fileMetadata,
        fileURL: downloadURL,
      };

      await this.firestoreService.saveFileMetadata(updatedMetadata);
      console.log('PDF saved successfully to Firebase!');
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  }



  public async getModifiedPdfBlob(): Promise<Blob | null> {
    try {
      console.log('Retrieving modified PDF from viewer...');
      const blob = await this.pdfViewerService.getCurrentDocumentAsBlob();
      return blob ? blob : null;
    } catch (error) {
      console.error('Error retrieving PDF:', error);
      return null;
    }
  }


  async handleSaveToFirebase() {
    console.log('Save button clicked. Fetching modified PDF...');

    const pdfBlob = await this.getModifiedPdfBlob();
    if (!pdfBlob) {
      console.error('Failed to retrieve modified PDF.');
      return;
    }

    await this.savePdfToFirebase(pdfBlob);
  }

  goBackToLibrary(): void {
    this.router.navigate(['/library']); // Navigates back to the library page
  }
}
