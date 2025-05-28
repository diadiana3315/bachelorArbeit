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
    initializeApp(environment.firebaseConfig);

    this.afAuth.setPersistence('local').then(() => {
      console.log('Auth persistence set to local storage.');
    }).catch((error) => {
      console.error('Error setting auth persistence:', error);
    });

    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
      this.user = user;
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.shouldDisplayLayout();
      });
  }

  shouldDisplayLayout(): boolean {
    const excludedRoutes = ['/login', '/register', '/viewer'];
    return !excludedRoutes.some(route => this.router.url.startsWith(route));

  }

  onSearch(query: string) {
    this.searchTerm = query;
    this.router.navigate(['/library'], { queryParams: { search: this.searchTerm } });

  }
}
