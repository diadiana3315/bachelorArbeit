import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import {SearchService} from '../services/search.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent {

  user: any;
  searchTerm: string = '';

  constructor(private afAuth: AngularFireAuth, private router: Router, private searchService: SearchService
  ) {
    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
      this.user = user;
    });
  }


  onSearch() {
    this.searchService.setSearchTerm(this.searchTerm); // Update search term globally
    this.router.navigate(['/library'], { queryParams: { search: this.searchTerm } }); // Redirect to library
  }
}
