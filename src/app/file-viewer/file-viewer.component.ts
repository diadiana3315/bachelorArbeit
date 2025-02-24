import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {FileMetadata} from '../models/file-metadata';
import {FirestoreService} from '../services/firestore.service';
import {UserService} from '../services/user.service';

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.css']
})
export class FileViewerComponent implements OnInit {
  fileUrl: string | null = null;
  browserLanguage: string = 'en-US'; // Default language
  fileMetadata: FileMetadata | null = null; // Store the metadata
  userId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private firestoreService: FirestoreService, // Assuming you have a service to interact with Firestore
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Fetch the file URL from query params
    this.route.queryParams.subscribe(async (params) => {
      this.fileUrl = params['fileURL'];

      if (!this.fileUrl) {
        this.router.navigate(['/library']);
        return;
      }

      this.userId = await this.userService.getCurrentUserId(); // Assuming you have a method to get the user ID
      //
      // if (!this.userId) {
      //   console.error('User not logged in or userId not found.');
      //   await this.router.navigate(['/login']); // Redirect to login if userId is not found
      //   return;
      // }

      try {
        this.fileMetadata = await this.firestoreService.getFileMetadataByUrl(this.fileUrl, this.userId);

        if (!this.fileMetadata) {
          console.error('File metadata not found!');
          this.router.navigate(['/library']);
        }
      } catch (error) {
        console.error('Error fetching file metadata:', error);
        this.router.navigate(['/library']);
      }
    });


    // Detect browser's default language
    this.browserLanguage = navigator.language || 'en-US';
  }
}
