import {Component, OnInit, ViewChild} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';
import {MatSidenav} from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'finalbachelor';
  user: any;

  @ViewChild('snav') sidenav: MatSidenav | undefined;

  constructor(private afAuth: AngularFireAuth, private router: Router) {
    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
      this.user = user;
    });
  }

  ngOnInit(): void {
    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.shouldDisplayLayout();
      });
  }

  toggleSidenav() {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  shouldDisplayLayout(): boolean {
    // List of routes where Navbar and Sidenav should NOT appear
    const excludedRoutes = ['/login', '/register'];
    return !excludedRoutes.includes(this.router.url);
  }
}
