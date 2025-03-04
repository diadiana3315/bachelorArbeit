import {Component, OnInit} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import {SearchService} from '../services/search.service';
import {FileMetadata} from '../models/file-metadata';
import {FirestoreService} from '../services/firestore.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  user: any;
  recentFiles: FileMetadata[] = []; // Store recent files here

  constructor(private afAuth: AngularFireAuth,
              private router: Router,
              private searchService: SearchService,
              private firestoreService: FirestoreService
  ) {
    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
      this.user = user;
      this.loadRecentFiles(); // Load recent files when user is authenticated
    });
  }

  ngOnInit(): void { }

  /**
   * Fetch the 5 most recent files from Firestore
   */
  loadRecentFiles() {
    this.firestoreService.getRecentFiles(this.user.uid, 5).subscribe((files) => {
      this.recentFiles = files;
    });
  }

  openFile(file: FileMetadata) {
    console.log('Opening file:', file);
    if (file.id) {
      this.firestoreService.updateFileAccessTimestamp(this.user.uid, file.id)
        .then(() => {
          // Open the file after updating timestamp
          if (['pdf', 'jpg', 'jpeg'].some(type => file.fileType.includes(type))) {
            window.open(file.fileURL, '_blank');
          } else {
            alert('Unsupported file type!');
          }
        })
        .catch(error => {
          console.error('Error updating access timestamp:', error);
          // Still open the file even if updating timestamp fails
          if (['pdf', 'jpg', 'jpeg'].some(type => file.fileType.includes(type))) {
            window.open(file.fileURL, '_blank');
          } else {
            alert('Unsupported file type!');
          }
        });
    }
  }

}
