import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {getAuth, onAuthStateChanged, User} from 'firebase/auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  email: string = 'Anonymous User'; // Default email
  profilePictureUrl: string = 'https://via.placeholder.com/64'; // Default profile picture

  constructor() {}

  ngOnInit() {
    const auth = getAuth(); // Get the Firebase Auth instance
    const user: User | null = auth.currentUser; // Get the currently logged-in user

    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.email = user.email || 'Anonymous User'; // Set email if available
        this.profilePictureUrl = user.photoURL || 'https://via.placeholder.com/64'; // Set profile picture if available
      } else {
        // Handle the case where no user is logged in
        this.email = 'Anonymous User';
        this.profilePictureUrl = 'https://via.placeholder.com/64';
      }
    });
  }
}
