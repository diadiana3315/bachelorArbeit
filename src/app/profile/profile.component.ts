import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {getAuth, onAuthStateChanged, User} from 'firebase/auth';
import {UserService} from '../services/user.service';
import {AngularFireAuth} from '@angular/fire/compat/auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  email: string = 'Anonymous User'; // Default email
  username: string = '';
  profilePictureUrl: string = 'https://via.placeholder.com/64'; // Default profile picture
  userId: string = '';
  newPassword: string = '';
  newEmail: string = '';
  errorMessage: string = '';
  lastLogin: string = 'Unknown';


  constructor(private userService: UserService, private afAuth: AngularFireAuth) {}

  async ngOnInit() {
    this.userId = await this.userService.getCurrentUserId();
    if (this.userId) {
      this.userService.getUser(this.userId).subscribe((doc) => {
        if (doc.exists) {
          const userData: any = doc.data();
          this.email = userData.email || 'Anonymous User';
          this.username = userData.username || 'No username set';
          this.profilePictureUrl = userData.profilePicture || 'https://via.placeholder.com/64';
          this.lastLogin = userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'Never';

        }
      });
    }
  }

  async updateProfile() {
    if (this.newEmail) {
      try {
        await this.userService.updateEmail(this.newEmail);
        this.email = this.newEmail; // Update UI
      } catch (error) {
        this.errorMessage = (error as Error).message; // Fix here
        return;
      }
    }

    if (this.newPassword.length >= 6) {
      try {
        await this.userService.updatePassword(this.newPassword);
      } catch (error) {
        this.errorMessage = (error as Error).message; // Fix here
        return;
      }
    }

    this.userService.updateUser(this.userId, {
      username: this.username,
      email: this.email
    }).then(() => {
      alert('Profile updated successfully!');
    }).catch((error) => {
      this.errorMessage = (error as Error).message; // Fix here
    });
  }

}
