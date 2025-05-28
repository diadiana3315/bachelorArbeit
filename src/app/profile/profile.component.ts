import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {FirebaseStorageService} from '../services/firebase-storage.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  email: string = '';
  username: string = '';
  profilePictureUrl: string = '';
  userId: string = '';
  newPassword: string = '';
  newEmail: string = '';
  errorMessage: string = '';
  lastLogin: string = 'Unknown';
  isEditing: boolean = false;
  isLoading: boolean = true;


  constructor(private userService: UserService,
              private afAuth: AngularFireAuth,
              private storage: FirebaseStorageService
  ) {
  }

  async ngOnInit() {
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.userId = user.uid;
        this.username = user.displayName || 'No username set';
        this.email = user.email || 'Anonymous User';
        this.profilePictureUrl = user.photoURL || 'https://via.placeholder.com/64';

        // Fetch additional user details from Firestore
        this.userService.getUser(this.userId).subscribe((doc) => {
          if (doc.exists) {
            const userData: any = doc.data();
            this.username = userData.username || this.username;
            this.email = userData.email || this.email;
            this.profilePictureUrl = userData.profilePicture || this.profilePictureUrl;
            this.lastLogin = userData.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'Never';
          }
          this.isLoading = false; // <-- Hide loading state once data is ready
        });
      } else {
        console.error('No user logged in');
        this.isLoading = false; // <-- Hide loading state once data is ready
      }
    });
  }


  async updateProfile() {
    if (this.newEmail) {
      try {
        await this.userService.updateEmail(this.newEmail);
        this.email = this.newEmail; // Update UI
      } catch (error) {
        this.errorMessage = (error as Error).message;
        return;
      }
    }

    if (this.newPassword.length >= 6) {
      try {
        await this.userService.updatePassword(this.newPassword);
      } catch (error) {
        this.errorMessage = (error as Error).message;
        return;
      }
    }

    this.userService.updateUser(this.userId, {
      username: this.username,
      email: this.email
    }).then(() => {
      alert('Profile updated successfully!');
    }).catch((error) => {
      this.errorMessage = (error as Error).message;
    });
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  async uploadProfilePicture(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!this.userId) {
      console.error("Error: userId is empty.");
      return;
    }
    if (!this.username) {
      console.error("Error: username is empty.");
      return;
    }

    const filePath = `${this.userId}/profile_${Date.now()}`;
    try {
      const downloadURL = await this.storage.uploadFile(file, filePath);

      await this.userService.updateUser(this.userId, { profilePicture: downloadURL });

      this.profilePictureUrl = downloadURL;
      console.log('Profile picture updated successfully!');
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
    }
  }

}

