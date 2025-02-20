import { Component } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-custom-toolbar',
  templateUrl: './custom-toolbar.component.html',
  styleUrl: './custom-toolbar.component.css'
})
export class CustomToolbarComponent {
  constructor(private router: Router) {}

  goBackToLibrary(): void {
    this.router.navigate(['/library']); // Navigates back to the library page
  }
}
