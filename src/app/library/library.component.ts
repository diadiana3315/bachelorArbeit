import {Component, Input, OnChanges, OnInit} from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FileMetadata } from '../models/file-metadata';
import {DomSanitizer} from '@angular/platform-browser';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SearchService} from '../services/search.service';


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
  folders: any[] = [];
  files: FileMetadata[] = [];
  userId: string = '';
  draggedFile: FileMetadata | null = null;
  filteredFiles: any[] = [];  // Search results
  filteredFolders: any[] = [];
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
    // Search globally, not just the current folder
    this.firestoreService.getAllFilesAndFolders(this.userId).subscribe(data => {
      this.filteredFiles = data.files.filter(file =>
        file.fileName.toLowerCase().includes(lowerQuery)
      );
      this.filteredFolders = this.folders.filter((folder: { name: string }) =>
        folder.name.toLowerCase().includes(lowerQuery)
      );
    });
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
  private loadFoldersAndFiles() {
    if (this.userId) {
      this.firestoreService.getFoldersAndFiles(this.userId, this.currentFolder ? this.currentFolder.id : null)
        .subscribe(data => {
          this.folders = data.folders;
          this.files = data.files;
          this.groupFilesUnderFolders();
        }, error => {
          console.error('Error loading folders and files:', error);
        });
    }
  }

  /**
   * Groups files under the corresponding folders based on their parentFolderId.
   */
  private groupFilesUnderFolders() {
    this.folders.forEach(folder => {
      folder.files = this.files.filter((file: FileMetadata) => file.parentFolderId === folder.id);
    });

    if (this.currentFolder) {
      this.currentFolder.files = this.files.filter((file: FileMetadata) => file.parentFolderId === this.currentFolder.id);
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
    // Check if file ID and user ID are defined before proceeding
    if (!file.userId || !file.id) {
      console.error('File userId or id is undefined');
      return; // Exit if either the userId or fileId is not available
    }

    // Call the Firestore service to delete the file
    this.firestoreService.deleteFile(file.userId, file.id).then(() => {
      this.loadFoldersAndFiles(); // Reload after deletion
    }).catch(error => {
      console.error('Error deleting file:', error);
    });
  }


  deleteFolder(folder: any) {
    if (!folder.id || !this.userId) {
      console.error('Invalid folder or user ID');
      return;
    }

    // Call Firestore service to delete the folder
    this.firestoreService.deleteFolderRecursively(this.userId, folder.id).then(() => {
      console.log(`Folder ${folder.id} deleted successfully`);
      this.loadFoldersAndFiles(); // Refresh UI
    }).catch(error => {
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

}
