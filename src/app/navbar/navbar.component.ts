import {Component, EventEmitter, Output, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {signOut} from '@angular/fire/auth';
import {UserService} from '../services/user.service';  // New import for Firebase Auth

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  // encapsulation: ViewEncapsulation.None // Disable encapsulation
})
export class NavbarComponent {
  @Output() toggleSidenav = new EventEmitter<void>();
  @Output() searchQuery = new EventEmitter<string>();  // Emit search query

  profilePictureUrl: string = 'https://via.placeholder.com/64'; // Default profile picture
  email: string = 'User'; // Default username
  userId: string | null = null; // To store the user's UID
  searchTerm: string = '';  // Store user input

  constructor(private router: Router)
  {
    const auth = getAuth(); // Get Firebase Auth instance
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.userId = user.uid; // Store the UID
        this.profilePictureUrl = user.photoURL || 'https://via.placeholder.com/64'; // Set profile picture URL
        this.email = user.email || 'No Email'; // Set email from Firebase Auth
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

  // loadUserData() {
  //   if (this.userId) {
  //     this.userService.getUser(this.userId).subscribe((doc) => {
  //       if (doc.exists) {
  //         const userData = doc.data();
  //         this.email = userData?.username || 'Anonymous User'; // Update username
  //       } else {
  //         console.error('User not found in Firestore');
  //       }
  //     });
  //   }
  // }

  // Navigate to Profile Page
  navigateToProfile() {
    this.router.navigate(['/profile'], {
      queryParams: {
        username: this.email,
        profilePictureUrl: this.profilePictureUrl
      }
    });
  }

  // Logout
  logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log('Logged out successfully');
      this.router.navigate(['/login']); // Navigate to the login page after logout
    }).catch((error) => {
      console.error('Logout failed:', error);
    });
  }

  emitSearch() {
    if (event) event.preventDefault();  // Prevent page reload
    this.searchQuery.emit(this.searchTerm.trim());  // Emit search term
  }

}
