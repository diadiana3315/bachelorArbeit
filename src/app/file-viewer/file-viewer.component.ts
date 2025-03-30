import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {FileMetadata} from '../models/file-metadata';
import {FirestoreService} from '../services/firestore.service';
import {UserService} from '../services/user.service';
import {NgxExtendedPdfViewerComponent} from 'ngx-extended-pdf-viewer';

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

  @ViewChild('pdfViewer') pdfViewer!: NgxExtendedPdfViewerComponent;
  @ViewChild('pdfContainer') pdfContainer!: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private firestoreService: FirestoreService,
    private userService: UserService
  ) {
  }

  ngOnInit(): void {
    // Fetch the file URL from query params
    this.route.queryParams.subscribe(async (params) => {
      this.fileUrl = params['fileURL'];

      if (!this.fileUrl) {
        await this.router.navigate(['/library']);
        return;
      }

      this.userId = await this.userService.getCurrentUserId();

      try {
        this.fileMetadata = await this.firestoreService.getFileMetadataByUrl(this.fileUrl, this.userId);

        if (!this.fileMetadata) {
          console.error('File metadata not found!');
          await this.router.navigate(['/library']);
        }
      } catch (error) {
        console.error('Error fetching file metadata:', error);
        await this.router.navigate(['/library']);
      }
    });

    // Detect browser's default language
    this.browserLanguage = navigator.language || 'en-US';
    console.log('PDF Viewer initialized:', this.pdfViewer);
  }

}
