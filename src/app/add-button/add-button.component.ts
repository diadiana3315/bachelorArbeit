import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {UserService} from '../services/user.service';
import jsPDF from "jspdf";
import {SharedFolderDialogComponent} from '../folder-dialog/shared-folder-dialog.component';
import {Folder} from '../models/folder';
import {MatDialog} from '@angular/material/dialog';
import {take} from 'rxjs';

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

  selectedFile: File | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private firebaseStorageService: FirebaseStorageService,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  /**
   * Handle folder creation by prompting the user for a folder name.
   * Once the user provides a name, it creates a folder object and emits an event for parent component to handle the creation.
   */
  async createFolder() {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      const userId = await this.userService.getCurrentUserId();
      const newFolder = {
        name: folderName,
        parentFolderId: this.currentFolder ? this.currentFolder.id : null,
        userId: userId
      };

      try {
        await this.firestoreService.createFolder(newFolder); // Call the createFolder method from the service
        console.log('Folder created successfully');
      } catch (error) {
        console.error('Error creating folder:', error); // Handle any errors
      }
    }
  }

  // async createFolder() {
  //   const folderName = prompt("Enter folder name:");
  //   if (!folderName) return;
  //
  //   const sharedWithStr = prompt("Share with (comma-separated user UIDs or emails)? (Leave empty if private)");
  //   const sharedWith = sharedWithStr ? sharedWithStr.split(',').map(x => x.trim()) : [];
  //
  //   const userId = await this.userService.getCurrentUserId();
  //
  //   const newFolder = {
  //     name: folderName,
  //     parentFolderId: this.currentFolder ? this.currentFolder.id : null,
  //     userId: userId,
  //     sharedWith: sharedWith,
  //     isShared: sharedWith.length > 0
  //   };
  //
  //   try {
  //     await this.firestoreService.createFolder(newFolder);
  //     console.log('Folder created successfully');
  //   } catch (error) {
  //     console.error('Error creating folder:', error);
  //   }
  // }

  // In add-button.component.ts

  // async createFolder() {
  //   const folderName = prompt("Enter folder name:");
  //   if (!folderName) return;
  //
  //   const sharedWithStr = prompt("Share with (comma-separated user IDs)? (Leave empty if private)");
  //   const sharedWith = sharedWithStr ? sharedWithStr.split(',').map(x => x.trim()) : [];
  //
  //   const userId = await this.userService.getCurrentUserId();
  //
  //   // Check if folder already exists
  //   const existingFolder = await this.firestoreService.getFolderByNameAndParent(
  //     folderName,
  //     userId,
  //     this.currentFolder?.id || null
  //   );
  //
  //   if (existingFolder) {
  //     console.warn('Folder with the same name already exists in this location.');
  //     return;
  //   }
  //
  //   const newFolder = {
  //     name: folderName,
  //     parentFolderId: this.currentFolder ? this.currentFolder.id : null,
  //     userId: userId,
  //     sharedWith: sharedWith,
  //     isShared: sharedWith.length > 0,
  //     createdAt: new Date()
  //   };
  //
  //   try {
  //     await this.firestoreService.createFolder(newFolder);
  //     console.log('Folder created successfully');
  //   } catch (error) {
  //     console.error('Error creating folder:', error);
  //   }
  // }

  /**
   * Trigger the file input for PDF upload by simulating a click event on the file input element.
   */
  uploadPDF() {
    this.fileInput.nativeElement.click();
  }

  /**
   * Trigger the image input for image upload by simulating a click event on the image input element.
   */
  uploadPhoto() {
    this.imageInput.nativeElement.click();
  }

  /**
   * Handle the file selection event for PDF uploads.
   * This method is triggered when a user selects a file for uploading.
   * @param event The event containing the selected file.
   */
  async onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (!this.selectedFile) return;

    const userId = await this.userService.getCurrentUserId();

      try {
        const uploadedFile = this.currentFolder?.isShared
          ? await this.firestoreService.uploadFileToSharedFolder(this.selectedFile, this.currentFolder.id, userId)
          : await this.firestoreService.uploadAndSaveFile(this.selectedFile, this.currentFolder, userId);



        console.log('File uploaded successfully:', uploadedFile);
        this.fileUploaded.emit(uploadedFile);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
  }

  /**
   * Handle the image selection event for image uploads.
   * This method is triggered when a user selects an image file for uploading.
   * @param event The event containing the selected image file.
   */
  async onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        // Convert image to PDF
        const pdfBlob = await this.convertImageToPDF(file);

        // Create a new File object from the PDF blob
        const pdfFile = new File([pdfBlob], file.name.replace(/\.[^/.]+$/, ".pdf"), {type: "application/pdf"});

        // Upload the PDF instead of the image
        const userId = await this.userService.getCurrentUserId();
        const uploadedFile = await this.firestoreService.uploadAndSaveFile(pdfFile, this.currentFolder ? this.currentFolder.id : null, userId);

        console.log("Image converted and uploaded as PDF:", uploadedFile);
        this.fileUploaded.emit(uploadedFile);
      } catch (error) {
        console.error("Error converting image to PDF:", error);
      }
    }
  }

  async convertImageToPDF(imageFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);

      reader.onload = function () {
        const imgData = reader.result as string;
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Add image to PDF
        pdf.addImage(imgData, "JPEG", 10, 10, 180, 0);

        // Convert PDF to blob (synchronously)
        const pdfBlob = pdf.output("blob");
        resolve(pdfBlob);
      };

      reader.onerror = reject;
    });
  }

  async openCreateSharedFolderDialog(): Promise<void> {
    const dialogRef = this.dialog.open(SharedFolderDialogComponent);

    dialogRef.afterClosed().pipe(take(1)).subscribe(async (result) => {
      if (result) {
        try {
          const userId = await this.userService.getCurrentUserId();

          // Check if folder exists first (optimization)
          const existingFolder = await this.firestoreService.getFolderByNameAndParent(
            result.name,
            userId,
            this.currentFolder?.id || null
          );

          if (existingFolder) {
            console.warn('Folder with the same name already exists.');
            return;
          }

          // Convert emails to user IDs
          const sharedWithUserIds: string[] = [];
          for (const email of result.sharedWithEmails) {
            const uid = await this.userService.getUserIdByEmail(email);
            if (uid) {
              if (typeof uid === "string") {
                sharedWithUserIds.push(uid);
              }
            } else {
              console.warn(`User with email ${email} not found`);
              // Optional: Show warning to user about invalid emails
            }
          }

          const sharedFolder: Folder = {
            name: result.name,
            parentFolderId: this.currentFolder?.id || null,
            userId: userId,
            sharedWith: sharedWithUserIds,  // Store user IDs, not emails
            sharedWithEmails: result.sharedWithEmails, // Optional: keep for reference
            isShared: sharedWithUserIds.length > 0,
            createdAt: new Date()  // Important for sorting
          };

          await this.firestoreService.createSharedFolder(sharedFolder);

          // Optional: Show success message
          // this.snackBar.open('Folder shared successfully!', 'Close', {duration: 3000});

        } catch (error) {
          console.error('Error creating shared folder:', error);
          // Optional: Show error to user
          // this.snackBar.open('Error sharing folder', 'Close', {duration: 3000});
        }
      }
    });
  }

}
