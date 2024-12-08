import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  toggleSidebar() {
    this.toggleSidenav.emit();
  }
}
