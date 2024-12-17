// import { Component, OnInit } from '@angular/core';
// import { FirestoreService } from '../services/firestore.service';
// import { AngularFireAuth } from '@angular/fire/compat/auth';
//
// @Component({
//   selector: 'app-library',
//   templateUrl: './library.component.html',
//   styleUrls: ['./library.component.css']
// })
// export class LibraryComponent implements OnInit {
//   currentFolder: any = null;  // Root folder context for library
//   folders: any[] = [];  // Example folder data
//   files: any[] = [];  // Array of files in the current context
//   userId: string = ''; // Initialize with an empty string or a default value
//   draggedFile: any = null;
//
//
//   constructor(
//     private firestoreService: FirestoreService,
//     private afAuth: AngularFireAuth
//   ) {}
//
//   async ngOnInit() {
//     await this.afAuth.onAuthStateChanged((user) => {
//       if (user) {
//         this.userId = user.uid; // Set the user's ID
//         console.log('User logged in:', user.uid);
//         this.loadFoldersAndFiles(); // Load data after ensuring the user is logged in
//       } else {
//         console.error('No user logged in.');
//         this.userId = ''; // Clear userId
//       }
//     });
//   }
//
//   onFolderCreated(newFolder: any) {
//     if (this.currentFolder) {
//       // If a folder is selected, add the new folder as a subfolder
//       this.currentFolder.files.push(newFolder);
//     } else {
//       // Otherwise, add it at the root level
//       this.folders.push(newFolder);
//     }
//     this.saveFolderToFirestore(newFolder);
//   }
//
//   onFileUploaded(fileMetadata: any) {
//     if (this.currentFolder) {
//       // Add the file to the current folder
//       this.currentFolder.files.push(fileMetadata);
//     } else {
//       // Add it to the root context
//       this.files.push(fileMetadata);
//     }
//   }
//
//   private loadFoldersAndFiles() {
//     if (this.userId) {
//       let query;
//
//       if (this.currentFolder && this.currentFolder.id) {
//         // Load files and folders within the current folder
//         query = this.firestoreService.getFoldersAndFilesByParentId(this.userId, this.currentFolder.id);
//       } else {
//         // Load files and folders in the root
//         query = this.firestoreService.getFoldersAndFiles(this.userId);
//       }
//
//       query.subscribe(data => {
//         this.folders = data.folders;
//         this.files = data.files;
//
//         this.groupFilesUnderFolders();
//       }, error => {
//         console.error('Error loading folders and files:', error);
//       });
//     }
//   }
//
//   private groupFilesUnderFolders() {
//     this.folders.forEach(folder => {
//       folder.files = this.files.filter(file => file.parentFolderId === folder.id);
//     });
//
//     // If there is a current folder, attach its files
//     if (this.currentFolder) {
//       this.currentFolder.files = this.files.filter(file => file.parentFolderId === this.currentFolder.id);
//     }
//   }
//
//   // When a file starts being dragged, store it temporarily
//   onDragStartFile(event: DragEvent, file: any) {
//     this.draggedFile = file; // Store dragged file temporarily
//     event.dataTransfer?.setData('text/plain', file.id);  // Optional: Set data for use later
//   }
//
//   // Allow the folder to accept the dragged file
//   onDragOverFolder(event: DragEvent) {
//     event.preventDefault();  // Allow the drop
//     event.stopPropagation();
//   }
//
//   // When a file is dropped into a folder
//   onDropFile(event: DragEvent, folder: any) {
//     event.preventDefault();
//     event.stopPropagation();
//
//     if (this.draggedFile) {
//       if (this.currentFolder) {
//         this.currentFolder.files = this.currentFolder.files.filter(
//           (file) => file.id !== this.draggedFile.id
//         );
//       }
//
//       // Update Firestore to reflect the new folder for the dragged file
//       this.updateFileParentFolder(this.draggedFile, folder.id);
//
//       // After successfully updating the file, update the UI to reflect the changes
//       folder.files.push(this.draggedFile);  // Add file to the new folder
//     }
//   }
//
//   // Update Firestore with the new parent folder for the dragged file
//   private updateFileParentFolder(file: any, newParentFolderId: string) {
//     file.parentFolderId = newParentFolderId;
//
//     this.firestoreService.saveFileMetadata(file).then(() => {
//       console.log(`File moved to folder ${newParentFolderId}`);
//       this.loadFoldersAndFiles(); // Reload files and folders to reflect changes
//     }).catch(error => {
//       console.error('Error updating file parent folder:', error);
//     });
//   }
//
//   private saveFolderToFirestore(folder: any) {
//     const folderData = {
//       name: folder.name,
//       parentFolderId: this.currentFolder ? this.currentFolder.id : null, // Link to parent
//       userId: this.userId // Save under the user's ID
//     };
//
//     this.firestoreService.saveFolder(folderData);
//   }
//
//   navigateToFolder(folder: any) {
//     console.log('Navigating to folder:', folder); // Check if folder is valid
//
//     if (folder && folder.id) {
//       this.currentFolder = { ...folder, files: folder.files || [] };
//       this.loadFoldersAndFiles();
//     } else {
//       console.error('Invalid folder:', folder);
//     }
//   }
//
//   navigateToRoot() {
//     this.currentFolder = null;
//     this.loadFoldersAndFiles(); // Reload root folders and files
//   }
//
//   openFile(file: any) {
//     if (file.fileType === 'pdf') {
//       window.open(file.fileURL, '_blank'); // Open in a new tab
//     } else {
//       alert('Unsupported file type!');
//     }
//   }
// }

import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FileMetadata } from '../models/file-metadata'; // Import the interface

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  currentFolder: any = null;
  folders: any[] = [];
  files: FileMetadata[] = [];  // Use the FileMetadata type here
  userId: string = '';
  draggedFile: FileMetadata | null = null;  // Use the FileMetadata type

  constructor(
    private firestoreService: FirestoreService,
    private afAuth: AngularFireAuth
  ) {}

  async ngOnInit() {
    await this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid;
        console.log('User logged in:', user.uid);
        this.loadFoldersAndFiles();
      } else {
        console.error('No user logged in.');
        this.userId = '';
      }
    });
  }

  onFolderCreated(newFolder: any) {
    if (this.currentFolder) {
      this.currentFolder.files.push(newFolder);
    } else {
      this.folders.push(newFolder);
    }
    this.saveFolderToFirestore(newFolder);
  }

  onFileUploaded(fileMetadata: FileMetadata) {
    if (this.currentFolder) {
      this.currentFolder.files.push(fileMetadata);
    } else {
      this.files.push(fileMetadata);
    }
  }

  private loadFoldersAndFiles() {
    if (this.userId) {
      let query;

      if (this.currentFolder && this.currentFolder.id) {
        query = this.firestoreService.getFoldersAndFilesByParentId(this.userId, this.currentFolder.id);
      } else {
        query = this.firestoreService.getFoldersAndFiles(this.userId);
      }

      query.subscribe(data => {
        this.folders = data.folders;
        this.files = data.files;

        this.groupFilesUnderFolders();
      }, error => {
        console.error('Error loading folders and files:', error);
      });
    }
  }

  private groupFilesUnderFolders() {
    this.folders.forEach(folder => {
      folder.files = this.files.filter((file: FileMetadata) => file.parentFolderId === folder.id);
    });

    if (this.currentFolder) {
      this.currentFolder.files = this.files.filter((file: FileMetadata) => file.parentFolderId === this.currentFolder.id);
    }
  }

  // When a file starts being dragged, store it temporarily
  onDragStartFile(event: DragEvent, file: FileMetadata) {
    this.draggedFile = file;
    event.dataTransfer?.setData('text/plain', file.id);
  }

  // Allow the folder to accept the dragged file
  onDragOverFolder(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  // When a file is dropped into a folder
// When a file is dropped into a folder
  onDropFile(event: DragEvent, folder: any) {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggedFile) {
      // Remove the file from the current folder
      if (this.currentFolder) {
        // If current folder exists, remove dragged file from it
        this.currentFolder.files = this.currentFolder.files.filter(
          (file: FileMetadata) => file.id !== this.draggedFile?.id
        );
      }

      // Update the parent folder ID in the dragged file
      this.draggedFile.parentFolderId = folder.id;

      // Save the dragged file's new parent folder in Firestore
      this.updateFileParentFolder(this.draggedFile, folder.id);

      // After saving, push the file into the new folder
      folder.files.push(this.draggedFile);

      // Update Firestore with the new folder structure for the dragged file
      this.firestoreService.saveFileMetadata(this.draggedFile).then(() => {
        console.log(`File moved to folder ${folder.id}`);
      }).catch(error => {
        console.error('Error saving moved file:', error);
      });
    }
  }


  private updateFileParentFolder(file: FileMetadata, newParentFolderId: string) {
    file.parentFolderId = newParentFolderId;

    this.firestoreService.saveFileMetadata(file).then(() => {
      console.log(`File moved to folder ${newParentFolderId}`);
      this.loadFoldersAndFiles();
    }).catch(error => {
      console.error('Error updating file parent folder:', error);
    });
  }

  private saveFolderToFirestore(folder: any) {
    const folderData = {
      name: folder.name,
      parentFolderId: this.currentFolder ? this.currentFolder.id : null,
      userId: this.userId
    };

    this.firestoreService.saveFolder(folderData);
  }

  navigateToFolder(folder: any) {
    console.log('Navigating to folder:', folder);

    if (folder && folder.id) {
      this.currentFolder = { ...folder, files: folder.files || [] };
      this.loadFoldersAndFiles();
    } else {
      console.error('Invalid folder:', folder);
    }
  }

  navigateToRoot() {
    this.currentFolder = null;
    this.loadFoldersAndFiles();
  }

  openFile(file: FileMetadata) {
    if (file.fileType === 'pdf') {
      window.open(file.fileURL, '_blank');
    } else {
      alert('Unsupported file type!');
    }
  }

  deleteFile(file: FileMetadata) {
    // Remove file from current folder in the UI
    if (this.currentFolder) {
      this.currentFolder.files = this.currentFolder.files.filter(
        (f: FileMetadata) => f.id !== file.id  // Specify the type of f
      );
    }

    // Also remove file from Firestore
    this.firestoreService.deleteFile(file).then(() => {
      console.log(`File ${file.id} deleted successfully`);
      this.loadFoldersAndFiles(); // Reload files and folders to reflect the change
    }).catch(error => {
      console.error('Error deleting file:', error);
    });
  }


}
