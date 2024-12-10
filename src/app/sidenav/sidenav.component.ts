import {ChangeDetectorRef, Component, inject, OnDestroy, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent{
  @ViewChild('snav') sidenav: MatSidenav | undefined;

  isSidenavOpen = false;

  toggleSidenav() {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }

  closeSidenav() {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }
}
