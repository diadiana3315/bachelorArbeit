import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  currentFolder: any = null;  // Root folder context for library
  folders: any[] = [];  // Example folder data
  files: any[] = [];  // Array of files in the current context
  userId: string = ''; // Initialize with an empty string or a default value


  constructor(
    private firestoreService: FirestoreService,
    private afAuth: AngularFireAuth
  ) {}

  async ngOnInit() {
    const user = await this.afAuth.currentUser;
    if (user) {
      this.userId = user.uid;  // Get the current user's ID
      this.loadFoldersAndFiles(); // Load folders and files after the user is authenticated
    } else {
      console.error('No user logged in');
    }
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
    if (this.userId) {
      // Subscribe to the observable
      this.firestoreService.getFoldersAndFiles(this.userId).subscribe(data => {
        this.folders = data.folders;
        this.files = data.files;
      }, error => {
        console.error('Error loading folders and files', error);
      });
    }
  }

  private saveFolderToFirestore(folder: any) {
    const folderData = {
      name: folder.name,
      parentFolderId: this.currentFolder ? this.currentFolder.id : null, // Link to parent
      userId: this.userId // Save under the user's ID
    };

    this.firestoreService.saveFolder(folderData);
  }

  navigateToFolder(folder: any) {
    this.currentFolder = folder;
    this.loadFoldersAndFiles();  // Reload the folder content
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
