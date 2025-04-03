import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-streak-calendar',
  templateUrl: './streak-calendar.component.html',
  styleUrls: ['./streak-calendar.component.css']
})
export class StreakCalendarComponent implements OnInit {
  currentDate = new Date();
  daysInMonth: { day: number | null, used: boolean, isToday?: boolean }[] = [];
  currentMonth: string = '';
  currentYear: number = 0;
  daysOfWeek: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  userId: string | null = null;

  constructor(private firestoreService: FirestoreService, private afAuth: AngularFireAuth) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.logCurrentDay(); // Log the current day when the user is authenticated
        this.loadUsedDays();
      }
    });

    // Set currentMonth and currentYear on init
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long' });
    this.currentYear = this.currentDate.getFullYear();
  }

  logCurrentDay() {
    if (this.userId) {
      this.firestoreService.logUserUsage(this.userId);
    }
  }

  async loadUsedDays() {
    if (!this.userId) return;

    // Fetch all usage records for this user
    const usedDates = await this.firestoreService.getUserUsageDays(this.userId);

    // Process the data for the current month
    const usedDays = new Set<number>();

    usedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (date.getFullYear() === this.currentYear && date.getMonth() === this.currentDate.getMonth()) {
        usedDays.add(date.getDate()); // Store the day only if it matches the selected month
      }
    });

    this.generateCalendar(usedDays);
  }


  generateCalendar(usedDays: Set<number>) {
    const daysInCurrentMonth = new Date(this.currentYear, this.currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(this.currentYear, this.currentDate.getMonth(), 1).getDay();

    this.daysInMonth = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      this.daysInMonth.push({ day: null, used: false });
    }

    // Add actual days of the month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const isUsed = usedDays.has(i);
      const isToday =
        i === this.currentDate.getDate() &&
        this.currentDate.getMonth() === new Date().getMonth() &&
        this.currentYear === new Date().getFullYear();

      this.daysInMonth.push({
        day: i,
        used: isUsed,
        isToday: isToday, // Track if it's today's date
      });
    }
  }

  changeMonth(direction: number) {
    // Update the currentDate to go to previous/next month
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);

    // Update the currentYear and currentMonth based on the new currentDate
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long' });
    this.currentYear = this.currentDate.getFullYear();

    // Load used days and generate the new calendar for the updated month
    this.loadUsedDays();
  }

}
