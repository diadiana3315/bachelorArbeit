import {AfterViewInit, Component, Input, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {FileMetadata} from '../models/file-metadata';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {FirestoreService} from '../services/firestore.service';
import {NgxExtendedPdfViewerService} from 'ngx-extended-pdf-viewer';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-custom-toolbar',
  templateUrl: './custom-toolbar.component.html',
  styleUrl: './custom-toolbar.component.css'
})
export class CustomToolbarComponent implements AfterViewInit, OnDestroy {
  @Input() fileMetadata!: FileMetadata;

  isAutoScrolling = false;
  animationFrameId: number | null = null;
  viewerContainer: HTMLElement | null = null;
  bpm: number = 60;
  autoScrollInterval: any = null; // Store the interval ID

  public onClick?: () => void;
  @Input() fileUrl: string | null = null;
  musicXmlUrl: string | null = null;

  isConverting: boolean = false;


  ngAfterViewInit() {
    this.waitForViewerContainer();

    // Listen for the document load event
    document.addEventListener('documentloaded', () => {
      this.extractPdfUrl();
    });
  }

  private extractPdfUrl() {
    const pdfViewer = document.querySelector('#viewerContainer') as any;

    if (pdfViewer && pdfViewer.src) {
      this.fileUrl = pdfViewer.src; // Assign the loaded file's URL
      console.log("Loaded PDF URL:", this.fileUrl);
    } else {
      console.warn("Could not retrieve PDF URL.");
    }
  }

  private waitForViewerContainer(attempts = 0) {
    setTimeout(() => {
      this.viewerContainer = document.querySelector('#viewerContainer') as HTMLElement;

      if (this.viewerContainer) {
        console.log('Viewer container found:', this.viewerContainer);
      } else if (attempts < 10) {
        console.warn(`Viewer container not found. Retrying... (${attempts + 1})`);
        this.waitForViewerContainer(attempts + 1);
      } else {
        console.error('Viewer container could not be found after multiple attempts.');
      }
    }, 500);
  }

  constructor(private router: Router,
              private auth: AngularFireAuth,
              private firestoreService: FirestoreService,
              private storageService: FirebaseStorageService,
              private pdfViewerService: NgxExtendedPdfViewerService,
              private http: HttpClient
  )
  {
    this.onClick = this.handleSaveToFirebase.bind(this);
  }


  async savePdfToFirebase(blob: Blob) {
    const user = await this.auth.currentUser;
    if (!user) {
      console.error('No user logged in!');
      return;
    }

    if (!this.fileMetadata) {
      console.error('File metadata is missing!');
      return;
    }

    const { userId, id: fileId, fileName, isShared, parentFolderId } = this.fileMetadata;

    if (!fileId || !fileName) {
      console.error('Invalid file metadata: missing fileId or fileName');
      return;
    }

    // Construct storage path
    let filePath: string;
    if (isShared && parentFolderId) {
      filePath = `shared/${parentFolderId}/${fileId}`; // For shared files
    } else {
      filePath = `${userId}/${fileId}`; // For private files
    }

    try {
      console.log('Uploading PDF to Firebase...');

      const downloadURL = await this.storageService.uploadFile(
        new File([blob], fileName, { type: 'application/pdf' }),
        filePath
      );

      if (!downloadURL) {
        console.error('Upload failed: No download URL returned.');
        return;
      }

      const updatedMetadata: FileMetadata = {
        ...this.fileMetadata,
        fileURL: downloadURL,
      };

      await this.firestoreService.saveFileMetadata(updatedMetadata);
      console.log('PDF saved successfully to Firebase!');
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  }



  public async getModifiedPdfBlob(): Promise<Blob | null> {
    try {
      console.log('Retrieving modified PDF from viewer...');
      const blob = await this.pdfViewerService.getCurrentDocumentAsBlob();
      return blob ? blob : null;
    } catch (error) {
      console.error('Error retrieving PDF:', error);
      return null;
    }
  }


  async handleSaveToFirebase() {
    console.log('Save button clicked. Fetching modified PDF...');

    const pdfBlob = await this.getModifiedPdfBlob();
    if (!pdfBlob) {
      console.error('Failed to retrieve modified PDF.');
      return;
    }

    await this.savePdfToFirebase(pdfBlob);
  }

  goBackToLibrary(): void {
    this.router.navigate(['/library']);
  }

  toggleAutoScroll() {
    this.isAutoScrolling = !this.isAutoScrolling;

    if (this.isAutoScrolling) {
      this.startAutoScroll();
    } else {
      this.stopAutoScroll();
    }
  }

  ngOnDestroy() {
    this.stopAutoScroll(); // Clean up interval when component is destroyed
  }


  convertToMusicXML() {
    if (!this.fileUrl) {
      alert("No file to convert!");
      return;
    }

    this.isConverting = true;
    console.log("Fetching file from URL:", this.fileUrl);

    fetch(this.fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const formData = new FormData();
        formData.append('file', blob, 'uploaded.pdf');

        this.http.post<{ fileName: string }>('http://localhost:3000/convert', formData)
          .subscribe({
            next: (response) => {
              if (!response?.fileName) {
                alert("Conversion failed!");
                return;
              }

              this.musicXmlUrl = `http://localhost:3000/download/${response.fileName}?t=${Date.now()}`;
            },
            error: (error) => {
              console.error("Conversion failed:", error);
              alert("Conversion failed!");
            },
            complete: () => this.isConverting = false
          });
      })
      .catch(error => {
        console.error("Error fetching PDF:", error);
        alert("Failed to fetch the PDF file!");
        this.isConverting = false;
      });
  }

  startAutoScroll() {
    if (!this.viewerContainer) {
      console.error('Viewer container not found! Cannot start scrolling.');
      return;
    }

    const pixelsPerSecond = this.bpm * 0.2;
    const pixelsPerFrame = pixelsPerSecond / 60; // Assume 60fps
    let scrollRemainder = 0;

    const step = () => {
      if (!this.isAutoScrolling || !this.viewerContainer) {
        return;
      }

      scrollRemainder += pixelsPerFrame;

      // Only scroll when enough accumulated to move at least 1 pixel
      if (scrollRemainder >= 1) {
        const scrollPixels = Math.floor(scrollRemainder);
        this.viewerContainer.scrollBy(0, scrollPixels);
        scrollRemainder -= scrollPixels;
      }

      this.animationFrameId = requestAnimationFrame(step);
    };

    this.animationFrameId = requestAnimationFrame(step);
  }


  stopAutoScroll() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

}
