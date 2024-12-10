import {Component, EventEmitter, Output, ViewChild} from '@angular/core';


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
