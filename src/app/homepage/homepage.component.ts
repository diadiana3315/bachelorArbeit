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
  username: string = ''; // Store username here
  recentFiles: FileMetadata[] = []; // Store recent files here

  practiceGoals: any = {
    timesPerWeek: 3, // Default: 3 times per week
    duration: 30, // Default: 30 minutes per session
    selectedDays: [] // Stores selected days if using "specific days"
  };

  streakCount: number = 0;
  currentWeekPractices: number = 0;
  currentWeekDuration: number = 0;

  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];



  constructor(private afAuth: AngularFireAuth,
              private router: Router,
              private searchService: SearchService,
              private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
      else {
        this.user = user;
        this.username = user?.displayName || 'Guest'; // Set username from Firebase auth
        this.loadRecentFiles(); // Load recent files when user is authenticated
        this.loadStreakData();

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

  loadStreakData() {
    // Get the user's practice streak data from Firestore
    this.firestoreService.getUserStreak(this.user.uid).subscribe(streakHistory => {
      if (streakHistory && streakHistory.length > 0) {
        const lastWeek = streakHistory[streakHistory.length - 1];
        this.streakCount = lastWeek.streakCount;
        this.currentWeekPractices = lastWeek.practices.length;
        this.currentWeekDuration = lastWeek.practices.reduce((acc, p) => acc + p.duration, 0);
      }
    });
  }

  // Update the streak after a practice session
  trackPractice(day: string, duration: number) {
    const currentDate = new Date();
    const currentWeekStart = this.getWeekStartDate(currentDate);

    if (duration >= this.practiceGoals.duration) {
      this.currentWeekPractices++;
      this.currentWeekDuration += duration;
    }

    const practiceData = {
      weekStart: currentWeekStart.toISOString(),
      practices: [{ day, duration }],
      streakCount: this.getStreakCount()
    };

    this.firestoreService.updateUserStreak(this.user.uid, practiceData);
  }

  getStreakCount() {
    if (this.currentWeekPractices >= this.practiceGoals.timesPerWeek && this.currentWeekDuration >= this.practiceGoals.timesPerWeek * this.practiceGoals.duration) {
      return this.streakCount + 1;
    }
    return 0;
  }

  getWeekStartDate(date: Date): Date {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek == 0 ? -6 : 1);
    const startDate = new Date(date.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    return startDate;
  }
}
