import {AfterViewInit, Component, Input, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {FileMetadata} from '../models/file-metadata';
import {FirebaseStorageService} from '../services/firebase-storage.service';
import {FirestoreService} from '../services/firestore.service';
import {NgxExtendedPdfViewerService} from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-custom-toolbar',
  templateUrl: './custom-toolbar.component.html',
  styleUrl: './custom-toolbar.component.css'
})
export class CustomToolbarComponent implements AfterViewInit, OnDestroy {
  @Input() fileMetadata!: FileMetadata;

  isAutoScrolling = false;
  scrollSpeed = 1; // Default speed (adjustable)
  animationFrameId: number | null = null;
  viewerContainer: HTMLElement | null = null;
  bpm: number = 60;
  autoScrollInterval: any = null; // Store the interval ID

  public onClick?: () => void;

  ngAfterViewInit() {
    this.waitForViewerContainer();
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
              private pdfViewerService: NgxExtendedPdfViewerService
  )
  { // Bind the `handleSaveToFirebase` method to the component's context
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

    const { userId, id: fileId, fileName } = this.fileMetadata;
    const filePath = `${userId}/${fileId}`; // Path in Firebase Storage

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

  startAutoScroll() {
    if (!this.viewerContainer) {
      console.error('Viewer container not found! Cannot start scrolling.');
      return;
    }

    this.stopAutoScroll(); // Stop any existing interval to prevent multiple from running

    // Convert BPM to a scroll delay (longer delay = slower scrolling)
    const beatsPerSecond = this.bpm / 60; // BPM to beats per second
    const scrollInterval = 1000 / beatsPerSecond; // Time (ms) per beat

    console.log(`🎵 BPM: ${this.bpm}, Scrolling every ${scrollInterval.toFixed(2)} ms`);

    this.autoScrollInterval = setInterval(() => {
      if (!this.isAutoScrolling || !this.viewerContainer) {
        this.stopAutoScroll();
        return;
      }
      this.viewerContainer.scrollBy(0, 1); // Scroll by **1 pixel** at each interval
    }, scrollInterval); // Interval controls the speed
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  // updateScrollSpeed(bpm: number) {
  //   // Ensure BPM stays in range (20 - 300)
  //   bpm = Math.max(20, Math.min(300, bpm));
  //
  //   const beatsPerSecond = bpm / 60; // Convert BPM to beats per second
  //   const pixelsPerBeat = 1; // Adjust this for slower/faster scrolling
  //   this.scrollSpeed = pixelsPerBeat * beatsPerSecond; // Compute px/sec
  //
  //   console.log(`🎵 BPM: ${bpm}, Scroll Speed: ${this.scrollSpeed.toFixed(2)} px/sec`);
  // }

  ngOnDestroy() {
    this.stopAutoScroll(); // Clean up interval when component is destroyed
  }
}
