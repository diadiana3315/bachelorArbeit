import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {UserService} from '../services/user.service';
import jsPDF from "jspdf";

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
    private userService: UserService
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
        const uploadedFile = await this.firestoreService.uploadAndSaveFile(
          this.selectedFile,
          this.currentFolder ? this.currentFolder.id : null,
          userId
        );

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

}
