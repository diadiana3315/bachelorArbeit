import {Component, OnInit} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import {SearchService} from '../services/search.service';
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
  streakCount: number = 0; // Will store the total number of distinct days the user logged in
  dailyMessage: string = '';

  practiceGoals: any = {
    timesPerWeek: 3, // Default: 3 times per week
    duration: 30, // Default: 30 minutes per session
    selectedDays: [] // Stores selected days if using "specific days"
  };

  weeklyPracticeMessage: string = '';

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
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Get Sunday of this week

    try {
      const usageDays = await this.firestoreService.getUserUsageDays(userId);
      this.streakCount = usageDays.size; // Count distinct login days

      // Count how many times the user logged in during the current week
      const daysPracticedThisWeek = Array.from(usageDays).filter(dateStr => {
        const date = new Date(dateStr);
        return date >= startOfWeek && date <= today;
      }).length;

      // Compare with practice goals
      const remainingDays = Math.max(0, this.practiceGoals.timesPerWeek - daysPracticedThisWeek);

      // Generate the message
      if (remainingDays === 0) {
        this.weeklyPracticeMessage = "Great job! You've completed your weekly practice goal!";
      } else {
        this.weeklyPracticeMessage = `You have ${remainingDays} more day${remainingDays > 1 ? 's' : ''} to practice this week!`;
      }
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
