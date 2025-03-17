import {Component, OnInit} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import {SearchService} from '../services/search.service';
import {FileMetadata} from '../models/file-metadata';
import {FirestoreService} from '../services/firestore.service';
import {DailyMessageService} from '../services/daily-message.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  user: any;
  username: string = ''; // Store username here
  recentFiles: FileMetadata[] = []; // Store recent files here
  streakCount: number = 0; // Will store the total number of distinct days the user logged in
  dailyMessage: string = '';

  practiceGoals: any = {
    timesPerWeek: 3, // Default: 3 times per week
    duration: 30, // Default: 30 minutes per session
    selectedDays: [] // Stores selected days if using "specific days"
  };


  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];



  constructor(private afAuth: AngularFireAuth,
              private router: Router,
              private searchService: SearchService,
              private firestoreService: FirestoreService,
              private dailyMessageService: DailyMessageService
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
      else {
        this.user = user;
        this.username = user?.displayName || 'Guest'; // Set username from Firebase auth
        this.firestoreService.logUserUsage(user.uid); // Log user activity

        this.loadStreakData(user.uid);
        this.loadDailyMessage();

        this.loadRecentFiles(); // Load recent files when user is authenticated
        // this.loadStreakData();

        if (user.uid) {
          this.firestoreService.getUserPracticeGoals(user.uid).subscribe(goals => {
            if (goals) {
              this.practiceGoals = goals;
            }
          });
        }
      }
    });
  }

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

  toggleDaySelection(day: string) {
    const index = this.practiceGoals.selectedDays.indexOf(day);
    if (index > -1) {
      this.practiceGoals.selectedDays.splice(index, 1);
    } else {
      this.practiceGoals.selectedDays.push(day);
    }
  }

  adjustSelectedDays() {
    // Ensure selectedDays does not exceed timesPerWeek
    while (this.practiceGoals.selectedDays.length > this.practiceGoals.timesPerWeek) {
      this.practiceGoals.selectedDays.pop();
    }
  }

  savePracticeGoals() {
    this.firestoreService.updateUserPracticeGoals(this.user.uid, this.practiceGoals)
      .then(() => alert('Practice goals saved!'))
      .catch(error => console.error('Error saving practice goals:', error));
  }

  async loadStreakData(userId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Firestore stores months as 1-based, so no need to adjust here

    try {
      const usageDays = await this.firestoreService.getUserUsageDays(userId, year, month);
      this.streakCount = usageDays.size; // Count distinct days logged in this month
    } catch (error) {
      console.error("Error loading streak data:", error);
    }
  }

  loadDailyMessage() {
    this.dailyMessageService.getDailyMessage().subscribe(
      (message: string) => {
        this.dailyMessage = message;
      },
      (error) => {
        console.error('Error fetching the daily message:', error);
        this.dailyMessage = 'Sorry, something went wrong while fetching the daily message.';
      }
    );
  }

}
