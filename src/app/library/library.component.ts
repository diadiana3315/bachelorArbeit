import { Component } from '@angular/core';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrl: './library.component.css'
})
export class LibraryComponent {
  currentFolder = null;  // Root folder context for library
  folders = [];  // Example folder data

  onFolderCreated(newFolder: any) {
    // Handle folder creation (e.g., update Firestore or UI)
    console.log('Folder created:', newFolder);
  }

  onFileUploaded(fileMetadata: any) {
    // Handle file upload (e.g., update Firestore or UI)
    console.log('File uploaded:', fileMetadata);
  }
}
