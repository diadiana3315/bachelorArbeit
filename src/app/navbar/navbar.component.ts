import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {signOut} from '@angular/fire/auth';  // New import for Firebase Auth

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  profilePictureUrl: string = 'https://via.placeholder.com/64'; // Default profile picture
  username: string = 'User'; // Default username

  constructor(private router: Router) {
    const auth = getAuth(); // Get Firebase Auth instance

    // Subscribe to the Firebase authentication state changes
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.username = user.displayName || 'Anonymous User';  // Set username
        this.profilePictureUrl = user.photoURL || 'https://via.placeholder.com/64';  // Set profile picture URL
      } else {
        this.username = 'Anonymous User';  // Default for no user logged in
        this.profilePictureUrl = 'https://via.placeholder.com/64';  // Default for no profile picture
      }
    });
  }

  toggleSidebar() {
    this.toggleSidenav.emit();
  }

  // Navigate to Profile Page
  navigateToProfile() {
    this.router.navigate(['/profile']);
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

}
