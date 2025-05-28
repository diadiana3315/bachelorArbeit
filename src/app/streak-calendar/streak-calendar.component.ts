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
  calendarRows: number = 0;

  constructor(private firestoreService: FirestoreService, private afAuth: AngularFireAuth) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.logCurrentDay();
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

    const usedDates = await this.firestoreService.getUserUsageDays(this.userId);

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

    for (let i = 0; i < firstDayOfMonth; i++) {
      this.daysInMonth.push({ day: null, used: false });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const isUsed = usedDays.has(i);
      const isToday =
        i === this.currentDate.getDate() &&
        this.currentDate.getMonth() === new Date().getMonth() &&
        this.currentYear === new Date().getFullYear();

      this.daysInMonth.push({
        day: i,
        used: isUsed,
        isToday: isToday,
      });
    }
    this.calendarRows = Math.ceil(this.daysInMonth.length / 7);

  }

  changeMonth(direction: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);

    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long' });
    this.currentYear = this.currentDate.getFullYear();

    this.loadUsedDays();
  }

}
