import {Component, EventEmitter, Output, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {signOut} from '@angular/fire/auth';
import {UserService} from '../services/user.service';
import {SearchService} from '../services/search.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  @Output() toggleSidenav = new EventEmitter<void>();
  @Output() searchQuery = new EventEmitter<string>();

  profilePictureUrl: string = 'https://via.placeholder.com/64';
  email: string = 'User';
  userId: string | null = null;
  searchTerm: string = '';

  constructor(private router: Router,
              private searchService: SearchService,
              private userService: UserService)
  {
    const auth = getAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.userId = user.uid;
        this.profilePictureUrl = user.photoURL || 'https://via.placeholder.com/64';
        this.email = user.email || 'No Email';
        this.userService.getUser(this.userId).subscribe((doc) => {
          if (doc.exists) {
            const userData: any = doc.data();
            this.profilePictureUrl = userData.profilePicture || this.profilePictureUrl;
          }
        });
      } else {
        this.userId = null; // Clear UID when no user is logged in
        this.email = 'Anonymous User'; // Reset username
        this.profilePictureUrl = 'https://via.placeholder.com/64'; // Reset profile picture
      }
    });
  }


  toggleSidebar() {
    this.toggleSidenav.emit();
  }

  navigateToProfile() {
    this.router.navigate(['/profile'], {
      queryParams: {
        username: this.email,
        profilePictureUrl: this.profilePictureUrl
      }
    });
  }

  logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log('Logged out successfully');
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Logout failed:', error);
    });
  }

  onSearch() {
    this.searchService.setSearchTerm(this.searchTerm);
    this.router.navigate(['/library'], { queryParams: { search: this.searchTerm } });
    this.searchTerm = '';  // Reset the search input field
  }
}
