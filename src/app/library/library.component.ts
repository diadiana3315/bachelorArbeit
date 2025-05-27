import {Component, Input, OnChanges, OnInit} from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FileMetadata } from '../models/file-metadata';
import {DomSanitizer} from '@angular/platform-browser';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SearchService} from '../services/search.service';
import {Folder} from '../models/folder';
import {combineLatest, switchMap} from 'rxjs';
import {map} from 'rxjs/operators';


/**
 * LibraryComponent is responsible for managing folders, files, and user interactions
 * with files in the Firebase Storage and Firestore.
 * It allows the user to upload files, organize them into folders, view them,
 * and delete them from both the UI and Firestore.
 */
@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  currentFolder: any = null;
  folders: Folder[] = [];
  files: FileMetadata[] = [];
  userId: string = '';
  draggedFile: FileMetadata | null = null;
  filteredFiles: any[] = [];  // Search results
  filteredFolders: Folder[] = [];
  searchActive: boolean = false;  // Flag to track search mode
  searchTerm: string = '';  // Store search query


  constructor(
    private firestoreService: FirestoreService,
    private afAuth: AngularFireAuth,
    private firebaseStorageService: FirebaseStorageService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute,
    private searchService: SearchService

  ) {}


  filterLibrary() {
    const lowerQuery = this.searchTerm.toLowerCase().trim();

    if (!lowerQuery) {
      // If search is empty, return to default view
      this.searchActive = false;
      this.filteredFiles = [...this.files];
      this.filteredFolders = [...this.folders];
      return;
    }

    this.searchActive = true;
    this.filteredFiles = this.files.filter(file =>
      file.fileName.toLowerCase().includes(lowerQuery)
    );
    this.filteredFolders = this.folders.filter(folder =>
      folder.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Lifecycle hook that is called when the component is initialized.
   * It checks for an authenticated user and loads the user's folders and files.
   */
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

    // Listen for search term updates from the global search service
    this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = term;
      this.filterLibrary();
    });

    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
        this.filterLibrary();
      }
    });
  }

  /**
   * Adds a newly created folder to the current folder or to the global list of folders.
   * It also saves the folder to Firestore.
   * @param newFolder The folder object to be added.
   */
  onFolderCreated(newFolder: any) {
    // Add new folder to Firestore
    this.firestoreService.createFolder(newFolder).then(() => {
      this.loadFoldersAndFiles(); // Reload folders and files
    }).catch(error => {
      console.error('Error creating folder:', error);
    });
  }

  /**
   * Adds the uploaded file metadata to the UI (either to the current folder or the global list).
   * @param fileMetadata The metadata of the uploaded file.
   */
  onFileUploaded(fileMetadata: FileMetadata) {
    if (this.currentFolder) {
      this.currentFolder.files.push(fileMetadata);
    } else {
      this.files.push(fileMetadata);
    }
  }

  /**
   * Loads folders and files for the current user.
   * It uses the FirestoreService to retrieve folders and files.
   */
  // private loadFoldersAndFiles() {
  //   if (this.userId) {
  //     this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder ? this.currentFolder.id : null)
  //       .subscribe(data => {
  //         this.folders = data.folders;
  //         this.files = data.files.map((file: FileMetadata) => ({
  //           ...file,
  //           isRenaming: false, // Initialize renaming state
  //           newName: file.fileName // Default value
  //         }));
  //         this.groupFilesUnderFolders();
  //       }, error => {
  //         console.error('Error loading folders and files:', error);
  //       });
  //   }
  // }

  // In library.component.ts

  // private loadFoldersAndFiles() {
  //   if (this.userId) {
  //     combineLatest([
  //       this.firestoreService.getAccessibleFolders(
  //         this.userId,
  //         this.currentFolder ? this.currentFolder.id : null
  //       ),
  //       this.firestoreService.getAccessibleFiles(
  //         this.userId,
  //         this.currentFolder ? this.currentFolder.id : null
  //       )
  //     ]).subscribe(([folders, files]) => {
  //       this.folders = folders;
  //       this.files = files.map(file => ({
  //         ...file,
  //         isRenaming: false,
  //         newName: file.fileName
  //       }));
  //
  //       this.groupFilesUnderFolders();
  //     }, error => {
  //       console.error('Error loading folders and files:', error);
  //     });
  //   }
  // }

  // private loadFoldersAndFiles() {
  //   if (!this.userId) return;
  //
  //   this.firestoreService.getAccessibleFolders(this.userId, this.currentFolder?.id || null)
  //     .pipe(
  //       switchMap(folders => {
  //         this.folders = folders;
  //
  //         const privateFolderIds = folders
  //           .filter(f => !f.isShared)
  //           .map(f => f.id);
  //
  //         const sharedFolders = folders.filter(f => f.isShared);
  //
  //         const privateFiles$ = this.firestoreService.getAccessibleFiles(this.userId, this.currentFolder?.id || null)
  //           .pipe(
  //             map(files =>
  //               files
  //                 .filter(file => !file.parentFolderId || privateFolderIds.includes(file.parentFolderId))
  //                 .map(file => ({
  //                   ...file,
  //                   isRenaming: false,
  //                   newName: file.fileName
  //                 }))
  //             )
  //           );
  //
  //         const sharedFiles$ = this.firestoreService.getFilesForSharedFolders(sharedFolders)
  //           .pipe(
  //             map(files =>
  //               files
  //                 .filter(file => file.parentFolderId === this.currentFolder?.id || (!file.parentFolderId && !this.currentFolder))
  //                 .map(file => ({
  //                   ...file,
  //                   isRenaming: false,
  //                   newName: file.fileName
  //                 }))
  //             )
  //           );
  //
  //         return combineLatest([privateFiles$, sharedFiles$]);
  //       })
  //     )
  //     .subscribe({
  //       next: ([privateFiles, sharedFiles]) => {
  //         this.files = [...privateFiles, ...sharedFiles];
  //         this.groupFilesUnderFolders(); // if this applies to shared too
  //       },
  //       error: err => console.error('Error loading folders/files:', err)
  //     });
  // }

  // private loadFoldersAndFiles() {
  //   if (!this.userId) return;
  //
  //   // if (this.currentFolder?.isShared) {
  //   //   this.firestoreService.getSharedFolderFiles(this.currentFolder.id).subscribe(files => {
  //   //     this.files = files;
  //   //     this.groupFilesUnderFolders();
  //   //   });
  //   // } else {
  //   //   this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder?.id || null).subscribe(data => {
  //   //     this.folders = data.folders;
  //   //     this.files = data.files;
  //   //     this.groupFilesUnderFolders();
  //   //   });
  //   // }
  //   //
  //   // // Load shared root folders if at root level
  //   // if (!this.currentFolder) {
  //   //   this.folders = this.folders || []; // Ensure it's an array before appending
  //   //
  //   //   this.firestoreService.getSharedFolders(this.userId).subscribe(shared => {
  //   //     this.folders = [...this.folders, ...shared.map(folder => ({ ...folder, isShared: true }))];
  //   //   });
  //   // }
  //
  //   if (!this.currentFolder) {
  //     // Get user's own folders
  //     this.firestoreService.getFoldersAndFiles(this.userId, null).subscribe(data => {
  //       this.folders = data.folders;
  //
  //       // Then get shared folders and merge them
  //       this.firestoreService.getSharedFolders(this.userId).subscribe(shared => {
  //         console.log('Shared folders:', shared);
  //         const sharedWithFlag = shared.map(folder => ({ ...folder, isShared: true }));
  //         this.folders = [...this.folders, ...sharedWithFlag];
  //       });
  //
  //       this.files = data.files;
  //       this.groupFilesUnderFolders();
  //     });
  //   }
  //
  // }

  private loadFoldersAndFiles(): void {
    if (!this.userId) return;

    // Case 1: Inside a shared folder — load its own subfolders and files
    if (this.currentFolder?.isShared) {
      this.firestoreService.getSharedFolderContents(this.currentFolder.id).subscribe(data => {
        this.folders = data.folders;
        this.files = data.files;
        this.groupFilesUnderFolders();
      });

      // Case 2: Inside a private folder — load its own subfolders and files
    } else if (this.currentFolder) {
      this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder.id).subscribe(data => {
        this.folders = data.folders;
        this.files = data.files;
        this.groupFilesUnderFolders();
      });

      // Case 3: Root level — load root private folders/files + all shared folders
    } else {
      this.firestoreService.getFoldersAndFiles(this.userId, null).subscribe(data => {
        this.folders = data.folders;
        this.files = data.files;
        this.groupFilesUnderFolders();
      });

      // Also load shared root folders
      this.firestoreService.getSharedFolders(this.userId).subscribe(shared => {
        this.folders = [...this.folders, ...shared.map(folder => ({ ...folder, isShared: true }))];
      });
    }
  }


  /**
   * Groups files under the corresponding folders based on their parentFolderId.
   */
  private groupFilesUnderFolders() {
    this.folders.forEach((folder: Folder) => {
      folder.files = this.files.filter((file: FileMetadata) =>
        file.parentFolderId === folder.id
      );
    });

    if (this.currentFolder) {
      this.currentFolder.files = this.files.filter((file: FileMetadata) =>
        file.parentFolderId === this.currentFolder?.id
      );
    }
  }

  /**
   * Stores the file temporarily when it starts being dragged.
   * @param event The drag event that contains the dragged file.
   * @param file The file that is being dragged.
   */
  onDragStartFile(event: DragEvent, file: FileMetadata) {
    this.draggedFile = file;
  }

  /**
   * Allows the folder to accept a dragged file by preventing the default drag-over behavior.
   * @param event The drag-over event.
   */
  onDragOverFolder(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Moves a file into a new folder when it is dropped into the folder.
   * It updates the parentFolderId and saves the changes to Firestore.
   * @param event The drop event containing the folder where the file is dropped.
   * @param folder The target folder to drop the file into.
   */
  onDropFile(event: DragEvent, folder: any) {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggedFile) {
      this.draggedFile.parentFolderId = folder.id;
      this.firestoreService.saveFileMetadata(this.draggedFile).then(() => {
        this.loadFoldersAndFiles(); // Reload after file move
      }).catch(error => {
        console.error('Error moving file:', error);
      });
    }
  }

  onRightClick(event: MouseEvent, item: any, type: 'file' | 'folder') {
    event.preventDefault(); // Prevent the default right-click menu

    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'file') {
        this.deleteFile(item);
      } else {
        this.deleteFolder(item);
      }
    }
  }

  onSwipeLeft(item: any, type: 'file' | 'folder') {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'file') {
        this.deleteFile(item);
      } else {
        this.deleteFolder(item);
      }
    }
  }

  /**
   * Opens a file for viewing.
   * @param file The file to open.
   */
  openFile(file: FileMetadata) {
    console.log('Opening file:', file);

    if (['pdf', 'jpg', 'jpeg'].some(type => file.fileType.includes(type))) {

      this.router.navigate(['/viewer'], {
        queryParams: { fileURL: file.fileURL }, // Pass fileURL as a query parameter
      });
    } else {
      alert('Unsupported file type!');
    }
  }

  /**
   * Deletes a file from both the UI and Firestore.
   * @param file The file metadata of the file to be deleted.
   */
  deleteFile(file: FileMetadata) {
    // Ensure required fields are present
    if (!file.userId || !file.id) {
      console.error('File userId or id is undefined');
      return;
    }

    const isShared = file.isShared || false;
    const parentFolderId = file.parentFolderId;

    this.firestoreService
      .deleteFile(file.userId, file.id, isShared, parentFolderId ?? undefined)
      .then(() => {
        this.loadFoldersAndFiles(); // Reload files/folders
      })
      .catch(error => {
        console.error('Error deleting file:', error);
      });
  }


  deleteFolder(folder: any) {
    if (!folder.id || !this.userId) {
      console.error('Invalid folder or user ID');
      return;
    }

    this.firestoreService.deleteFolderRecursively(this.userId, folder.id, folder.isShared === true)
      .then(() => {
        console.log(`Folder ${folder.id} deleted successfully`);
        this.loadFoldersAndFiles(); // Refresh UI
      })
      .catch(error => {
        console.error('Error deleting folder:', error);
      });
  }

  /**
   * Navigates to a specific folder, updating the current folder.
   * @param folder The folder to navigate to.
   */
  navigateToFolder(folder: any) {
    console.log('Navigating to folder:', folder);

    if (folder && folder.id) {
      this.currentFolder = { ...folder, files: folder.files || [] };
      this.loadFoldersAndFiles();
    } else {
      console.error('Invalid folder:', folder);
    }
  }

  /**
   * Navigates to the root folder.
   */
  navigateToRoot() {
    this.currentFolder = null;
    this.loadFoldersAndFiles();
  }

  clearSearch() {
    this.searchActive = false;
    this.filteredFiles = [];
    this.filteredFolders = [];
  }

  // Enable rename mode
  enableRename(file: any) {
    file.isRenaming = true;
    file.newName = file.fileName; // Set initial value to the current name
  }
  cancelRename(file: FileMetadata) {
    file.isRenaming = false;
    file.newName = '';
  }

  saveFileName(file: any) {
    if (!file.id || !this.userId) {
      console.error('File ID is missing for rename!');
      return;
    }

    const newName = file.newName?.trim();
    if (!newName || newName === file.fileName) {
      this.cancelRename(file);
      return;
    }

    console.log(`Renaming file ID ${file.id} to ${newName}`);

    this.firestoreService.updateFileName(
      this.userId,
      file.id,
      newName,
      file.isShared,
      file.parentFolderId
    ).then(() => {
      file.fileName = newName;
      file.isRenaming = false;
    }).catch(error => {
      console.error('Error updating file name:', error);
      alert('Failed to rename file. Please try again.');
      this.cancelRename(file);
    });
  }

}
