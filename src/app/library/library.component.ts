import {Component, OnInit} from '@angular/core';
import {FirestoreService} from '../services/firestore.service';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrl: './library.component.css'
})
export class LibraryComponent implements OnInit{
  currentFolder: any = null;  // Root folder context for library
  folders: any[] = [];  // Example folder data
  files: any[] = []; // Array of files in the current context

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    // Fetch folders and files from Firestore on initialization
    this.loadFoldersAndFiles();
  }

  onFolderCreated(newFolder: any) {
    if (this.currentFolder) {
      // If a folder is selected, add the new folder as a subfolder
      this.currentFolder.files.push(newFolder);
    } else {
      // Otherwise, add it at the root level
      this.folders.push(newFolder);
    }
    this.saveFolderToFirestore(newFolder);
  }

  onFileUploaded(fileMetadata: any) {
    if (this.currentFolder) {
      // Add the file to the current folder
      this.currentFolder.files.push(fileMetadata);
    } else {
      // Add it to the root context
      this.files.push(fileMetadata);
    }
  }

  private loadFoldersAndFiles() {
    const parentFolderId = this.currentFolder ? this.currentFolder.id : null;
    this.firestoreService.getFoldersAndFiles(parentFolderId).subscribe((data: any) => {
      this.folders = data.folders;
      this.files = data.files;
    });
  }

  private saveFolderToFirestore(folder: any) {
    const folderData = {
      name: folder.name,
      parentFolderId: this.currentFolder ? this.currentFolder.id : null, // Link to parent
    };

    this.firestoreService.addFolderMetadata(folderData).then((docRef) => {
      folder.id = docRef.id; // Set the ID for future updates
      console.log('Folder metadata saved to Firestore');
    });
  }

  navigateToFolder(folder: any) {
    this.currentFolder = folder;
    this.folders = folder.folders || [];
    this.files = folder.files || [];
  }

  navigateToRoot() {
    this.currentFolder = null;
    this.loadFoldersAndFiles(); // Reload root folders and files
  }

  openFile(file: any) {
    if (file.fileType === 'pdf') {
      window.open(file.fileURL, '_blank'); // Open in a new tab
    } else {
      alert('Unsupported file type!');
    }
  }
}
