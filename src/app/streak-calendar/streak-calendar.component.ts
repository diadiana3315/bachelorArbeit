import {Component, OnInit} from '@angular/core';


@Component({
  selector: 'app-streak-calendar',
  templateUrl: './streak-calendar.component.html',
  styleUrl: './streak-calendar.component.css'
})
export class StreakCalendarComponent implements OnInit{
  currentDate = new Date();
  daysInMonth: (number | null)[] = [];
  currentMonth: string = '';
  currentYear: number = 0;
  daysOfWeek: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long' });
    this.currentYear = this.currentDate.getFullYear();

    const daysInCurrentMonth = new Date(this.currentYear, this.currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(this.currentYear, this.currentDate.getMonth(), 1).getDay();

    this.daysInMonth = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      this.daysInMonth.push(null);
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      this.daysInMonth.push(i);
    }
  }

  changeMonth(direction: number) {
    // Update the currentDate to go to previous/next month
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.generateCalendar();
  }

}
