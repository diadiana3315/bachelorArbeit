import {Component, OnInit, ViewChild} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';
import {MatSidenav} from '@angular/material/sidenav';
import {initializeApp} from '@angular/fire/app';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'finalbachelor';
  user: any;
  searchTerm: string = '';

  @ViewChild('sidenav') sidenav: MatSidenav | undefined;

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  ngOnInit(): void {
    // Initialize Firebase App
    initializeApp(environment.firebaseConfig); // Initialize Firebase with your config

    // Set Firebase auth persistence to 'local'
    this.afAuth.setPersistence('local').then(() => {
      console.log('Auth persistence set to local storage.');
    }).catch((error) => {
      console.error('Error setting auth persistence:', error);
    });

    // Listen to Firebase auth state changes
    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
      this.user = user;
    });

    // Listen to route changes for layout management
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.shouldDisplayLayout();
      });
  }
  // toggleSidenav() {
  //   if (this.sidenav) {
  //     this.sidenav.toggle();
  //   }
  // }

  shouldDisplayLayout(): boolean {
    // List of routes where Navbar and Sidenav should NOT appear
    const excludedRoutes = ['/login', '/register', '/viewer'];
    // return !excludedRoutes.includes(this.router.url);
    return !excludedRoutes.some(route => this.router.url.startsWith(route));

  }

  onSearch(query: string) {
    this.searchTerm = query;
    this.router.navigate(['/library'], { queryParams: { search: this.searchTerm } });

  }
}
