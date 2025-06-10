import {ChangeDetectorRef, Component, Input, OnChanges, OnInit} from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FileMetadata } from '../models/file-metadata';
import {DomSanitizer} from '@angular/platform-browser';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SearchService} from '../services/search.service';
import {Folder} from '../models/folder';
import {combineLatest, Subscription, take} from 'rxjs';


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
  currentFolder: Folder | null = null;
  folders: Folder[] = [];
  files: FileMetadata[] = [];
  userId: string = '';
  draggedFile: FileMetadata | null = null;
  filteredFiles: any[] = [];
  filteredFolders: Folder[] = [];
  searchActive: boolean = false;
  searchTerm: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private firestoreService: FirestoreService,
    private afAuth: AngularFireAuth,
    private firebaseStorageService: FirebaseStorageService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef

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

  // async ngOnInit() {
  //   const user = await this.afAuth.currentUser;
  //   if (user) {
  //     this.userId = user.uid;
  //     console.log('User logged in:', this.userId);
  //     this.loadFoldersAndFiles();
  //   } else {
  //     console.error('No user logged in.');
  //   }
  //
  //   this.searchService.searchTerm$.subscribe(term => {
  //     this.searchTerm = term;
  //     this.filterLibrary();
  //   });
  //
  //   this.route.queryParams.subscribe(params => {
  //     if (params['search']) {
  //       this.searchTerm = params['search'];
  //       this.filterLibrary();
  //     }
  //   });
  // }

  // ngOnInit() {
  //   this.afAuth.currentUser.then(user => {
  //     if (user) {
  //       this.userId = user.uid;
  //       console.log('User logged in:', this.userId);
  //       this.loadFoldersAndFiles();
  //     } else {
  //       console.error('No user logged in.');
  //     }
  //   });
  //
  //   const searchSub = this.searchService.searchTerm$.subscribe(term => {
  //     this.searchTerm = term;
  //     this.filterLibrary();
  //   });
  //
  //   const querySub = this.route.queryParams.subscribe(params => {
  //     if (params['search']) {
  //       this.searchTerm = params['search'];
  //       this.filterLibrary();
  //     }
  //   });
  //
  //   this.subscriptions.push(searchSub, querySub);
  // }


  // private loadFoldersAndFiles(): void {
  //   if (!this.userId) return;
  //
  //   // Clear existing state
  //   this.folders = [];
  //   this.files = [];
  //
  //   if (this.currentFolder?.isShared) {
  //     if (this.currentFolder.id != null) {
  //       this.firestoreService.getSharedFolderContents(this.currentFolder.id).subscribe(data => {
  //         this.folders = data.folders;
  //         this.files = data.files;
  //         this.groupFilesUnderFolders();
  //         this.cdr.detectChanges();
  //       });
  //     }
  //   } else if (this.currentFolder) {
  //     this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder.id).subscribe(data => {
  //       this.folders = data.folders;
  //       this.files = data.files;
  //       this.groupFilesUnderFolders();
  //       this.cdr.detectChanges();
  //     });
  //   } else {
  //     this.firestoreService.getFoldersAndFiles(this.userId, null).subscribe(data => {
  //       this.folders = data.folders;
  //       this.files = data.files;
  //       this.groupFilesUnderFolders();
  //
  //       this.firestoreService.getSharedFolders(this.userId).subscribe(shared => {
  //         const sharedFolders = shared.map(folder => ({ ...folder, isShared: true }));
  //
  //         // Filter out any shared folders that are already in the list
  //         const existingIds = new Set(this.folders.map(f => f.id));
  //         const newSharedFolders = sharedFolders.filter(f => !existingIds.has(f.id));
  //
  //         this.folders = [...this.folders, ...newSharedFolders];
  //         this.cdr.detectChanges();
  //       });
  //     });
  //   }
  // }
  //

  //buna
  // private loadFoldersAndFiles(): void {
  //   if (!this.userId) return;
  //
  //   // Reset UI state before loading new data
  //   this.folders = [];
  //   this.files = [];
  //
  //   if (this.currentFolder?.isShared) {
  //     if (this.currentFolder.id) {
  //       this.firestoreService.getSharedFolderContents(this.currentFolder.id).subscribe(data => {
  //         this.folders = data.folders;
  //         this.files = data.files;
  //         this.sortFiles();
  //         this.groupFilesUnderFolders();
  //         this.cdr.detectChanges();
  //       });
  //     }
  //   } else if (this.currentFolder) {
  //     this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder.id).subscribe(data => {
  //       this.folders = data.folders;
  //       this.files = data.files;
  //       this.sortFiles();
  //       this.groupFilesUnderFolders();
  //       this.cdr.detectChanges();
  //     });
  //   } else {
  //     // Combine both observables and wait for both to emit before updating UI
  //     combineLatest([
  //       this.firestoreService.getFoldersAndFiles(this.userId, null),
  //       this.firestoreService.getSharedFolders(this.userId)
  //     ]).subscribe(([userData, sharedFolders]) => {
  //       const shared = sharedFolders.map(folder => ({ ...folder, isShared: true }));
  //       const existingIds = new Set(userData.folders.map((f: Folder) => f.id));
  //       const newShared = shared.filter(f => !existingIds.has(f.id));
  //
  //       this.folders = [...userData.folders, ...newShared];
  //       this.files = userData.files;
  //       this.sortFiles();
  //       this.groupFilesUnderFolders();
  //       this.cdr.detectChanges();
  //     });
  //   }
  // }

  private loadFoldersAndFiles(): void {
    if (!this.userId) return;

    // Reset UI state before loading new data
    this.folders = [];
    this.files = [];

    // Case 1: Inside a shared folder
    if (this.currentFolder?.isShared) {
      if (this.currentFolder.id) {
        this.firestoreService.getSharedFolderContents(this.currentFolder.id).subscribe(data => {
          this.folders = data.folders;
          this.files = data.files;

          const fileIds = this.files
            .map(f => f.id)
            .filter((id): id is string => typeof id === 'string');

          // Fetch user-specific metadata for these shared files
          this.firestoreService.getUserMetadataForFiles(fileIds, this.userId).subscribe(userMetadata => {
            this.files.forEach(file => {
              if (file.id) {
                const metadata = userMetadata[file.id];
                if (metadata) {
                  file.practiced = metadata.practiced ?? false;
                  file.isFavorite = metadata.isFavorite ?? false;
                }
              }
            });

            this.sortFiles();
            this.groupFilesUnderFolders();
            this.cdr.detectChanges();
          });
        });
      }

      // Case 2: Inside a personal folder
    } else if (this.currentFolder) {
      this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder.id).subscribe(data => {
        this.folders = data.folders;
        this.files = data.files;

        this.sortFiles();
        this.groupFilesUnderFolders();
        this.cdr.detectChanges();
      });

      // Case 3: At root level (load both private + shared folders)
    } else {
      combineLatest([
        this.firestoreService.getFoldersAndFiles(this.userId, null),
        this.firestoreService.getSharedFolders(this.userId)
      ]).subscribe(([userData, sharedFolders]) => {
        const shared = sharedFolders.map(folder => ({ ...folder, isShared: true }));
        const existingIds = new Set(userData.folders.map((f: Folder) => f.id));
        const newShared = shared.filter(f => !existingIds.has(f.id));

        this.folders = [...userData.folders, ...newShared];
        this.files = userData.files;

        this.sortFiles();
        this.groupFilesUnderFolders();
        this.cdr.detectChanges();
      });
    }
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
      if (this.currentFolder.files) {
        this.currentFolder.files.push(fileMetadata);
      }
    } else {
      this.files.push(fileMetadata);
    }
  }

  /**
   * Loads folders and files for the current user.
   * It uses the FirestoreService to retrieve folders and files.
   */
  // private loadFoldersAndFiles(): void {
  //   if (!this.userId) return;
  //
  //   if (this.currentFolder?.isShared) {
  //     if (this.currentFolder.id != null) {
  //       this.firestoreService.getSharedFolderContents(this.currentFolder.id).subscribe(data => {
  //         this.folders = data.folders;
  //         this.files = data.files;
  //         this.groupFilesUnderFolders();
  //       });
  //     }
  //
  //   } else if (this.currentFolder) {
  //     this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder.id).subscribe(data => {
  //       this.folders = data.folders;
  //       this.files = data.files;
  //       this.groupFilesUnderFolders();
  //     });
  //
  //   } else {
  //     this.firestoreService.getFoldersAndFiles(this.userId, null).subscribe(data => {
  //       this.folders = data.folders;
  //       this.files = data.files;
  //       this.groupFilesUnderFolders();
  //     });
  //
  //     this.firestoreService.getSharedFolders(this.userId).subscribe(shared => {
  //       this.folders = [...this.folders, ...shared.map(folder => ({ ...folder, isShared: true }))];
  //     });
  //   }
  // }


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
    if (this.getCurrentUserRole() === 'editor') {
      this.draggedFile = file;
    } else {
      event.preventDefault();
    }  }

  /**
   * Allows the folder to accept a dragged file by preventing the default drag-over behavior.
   * @param event The drag-over event.
   */
  onDragOverFolder(event: DragEvent) {
    if (this.getCurrentUserRole() === 'editor') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Moves a file into a new folder when it is dropped into the folder.
   * It updates the parentFolderId and saves the changes to Firestore.
   * @param event The drop event containing the folder where the file is dropped.
   * @param folder The target folder to drop the file into.
   */
  onDropFile(event: DragEvent, folder: any) {
    if (this.getCurrentUserRole() !== 'editor') {
      event.preventDefault();
      return;
    }

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

    if (this.getCurrentUserRole() !== 'editor') {
      alert('You do not have permission to delete this item.');
      return;
    }

    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'file') {
        this.deleteFile(item);
      } else {
        this.deleteFolder(item);
      }
    }
  }

  onSwipeLeft(item: any, type: 'file' | 'folder') {
    if (this.getCurrentUserRole() !== 'editor') {
      alert('You do not have permission to delete this item.');
      return;
    }

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

    if (this.getCurrentUserRole() !== 'editor') {
      alert('You do not have permission to delete this file.');
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

    if (this.getCurrentUserRole() !== 'editor' && folder?.isShared) {
      alert('You do not have permission to delete this folder.');
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
    file.newName = file.fileName;
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

    if (this.getCurrentUserRole() !== 'editor') {
      alert('You do not have permission to rename this file.');
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

  getCurrentUserRole(): 'editor' | 'viewer' | null {
    if (!this.userId) return null;

    if (!this.currentFolder) {
      return 'editor';
    }

    if (!this.currentFolder.isShared) {
      return 'editor';
    }

    if (this.currentFolder.userId === this.userId) {
      return 'editor';
    }

    if (!Array.isArray(this.currentFolder.sharedWith)) return null;

    const sharedUser = this.currentFolder.sharedWith.find(
      (u) => u.userId === this.userId
    );

    console.log(`Current user role in folder ${this.currentFolder.id}:`, sharedUser?.role);
    return sharedUser?.role || null;
  }



  onSharingUpdated(updatedFolder: Folder) {
    this.currentFolder = updatedFolder;
  }


  // togglePracticed(file: FileMetadata): void {
  //   if (!file.id || !this.userId) return;
  //
  //   this.firestoreService
  //     .updateFilePracticed(this.userId, file.id, file.practiced ?? false, file.isShared, file.parentFolderId ?? undefined)
  //     .then(() => {
  //       console.log(`File ${file.fileName} marked as ${file.practiced ? 'practiced' : 'not practiced'}`);
  //     })
  //     .catch((error) => {
  //       console.error('Failed to update practiced status:', error);
  //     });
  // }

  // togglePracticed(file: FileMetadata) {
  //   if (!file.id || !this.userId) return;
  //
  //   const newValue = !file.practiced;
  //   file.practiced = newValue;
  //
  //   if (file.isShared) {
  //     // READ existing metadata before writing
  //     this.firestoreService.getUserMetadataForFiles([file.id], this.userId).subscribe(userMetadata => {
  //       const existing = userMetadata[file.id] || {};
  //       const updated = {
  //         ...existing,
  //         practiced: newValue
  //       };
  //
  //       this.firestoreService.setFileUserMetadata(file.id!, this.userId!, updated);
  //     });
  //   } else {
  //     this.firestoreService.updateFilePracticed(this.userId, file.id, newValue, false, file.parentFolderId ?? undefined);
  //   }
  // }

  // togglePracticed(file: FileMetadata) {
  //   if (!file.id || !this.userId) return;
  //
  //   const newValue = !file.practiced;
  //   file.practiced = newValue;
  //
  //   if (file.isShared) {
  //     this.firestoreService.getUserMetadataForFiles([file.id], this.userId).subscribe(userMetadata => {
  //       const existing = userMetadata[file.id! as string] || {};
  //       const updated = {
  //         ...existing,
  //         practiced: newValue
  //       };
  //
  //       this.firestoreService.setFileUserMetadata(file.id!, this.userId!, updated);
  //     });
  //   } else {
  //     this.firestoreService.updateFilePracticed(
  //       this.userId,
  //       file.id,
  //       newValue,
  //       false,
  //       file.parentFolderId ?? undefined
  //     );
  //   }
  // }

  async togglePracticed(file: FileMetadata, newValue: boolean) {
    if (!file.id || !this.userId) {
      console.error('Missing file ID or user ID');
      return;
    }

    try {
      file.practiced = newValue;

      if (file.isShared) {
        const existingMetadata = await this.firestoreService
          .getUserMetadataForFiles([file.id], this.userId)
          .pipe(take(1))
          .toPromise();

        const updatedMetadata = {
          ...(existingMetadata?.[file.id] || {}),
          practiced: newValue
        };

        await this.firestoreService.setFileUserMetadata(
          file.id,
          this.userId,
          updatedMetadata
        );
      } else {
        await this.firestoreService.updateFilePracticed(
          this.userId,
          file.id,
          newValue,
          false,
          file.parentFolderId
        );
      }

      console.log(`Successfully updated practiced status for file ${file.id}`);
    } catch (error) {
      console.error('Failed to update practiced status:', error);
      // Revert UI state if update failed
      file.practiced = !newValue;
      this.cdr.detectChanges();
    }
  }


  // toggleFavorite(file: FileMetadata): void {
  //   file.isFavorite = !file.isFavorite;
  //   this.firestoreService.saveFileMetadata(file)
  //     .then(() => this.sortFiles()) // re-sort after update
  //     .catch(err => console.error('Failed to update favorite status:', err));
  // }

  // toggleFavorite(file: FileMetadata) {
  //   file.isFavorite = !file.isFavorite;
  //
  //   if (file.isShared) {
  //     if (file.id) {
  //       this.firestoreService.setFileUserMetadata(file.id, this.userId, {
  //         isFavorite: file.isFavorite
  //       });
  //     } else {
  //       console.warn('Cannot update metadata: file.id is undefined for shared file');
  //     }
  //   } else {
  //     this.firestoreService.saveFileMetadata(file);
  //   }
  //
  //   this.sortFiles();
  // }


  toggleFavorite(file: FileMetadata) {
    if (!file.id || !this.userId) return;

    file.isFavorite = !file.isFavorite;

    if (file.isShared) {
      this.firestoreService.getUserMetadataForFiles([file.id], this.userId).subscribe(userMetadata => {
        const existing = userMetadata[file.id! as string] || {};
        const updated = {
          ...existing,
          isFavorite: file.isFavorite
        };

        this.firestoreService.setFileUserMetadata(file.id!, this.userId!, updated);
      });
    } else {
      this.firestoreService.saveFileMetadata(file);
    }

    this.sortFiles();
  }


  private sortFiles(): void {
    this.files.sort((a, b) => {
      const aFav = a.isFavorite ? 1 : 0;
      const bFav = b.isFavorite ? 1 : 0;

      // Show favorites on top, then alphabetically
      if (bFav !== aFav) {
        return bFav - aFav;
      }
      return a.fileName.localeCompare(b.fileName);
    });
  }

}
