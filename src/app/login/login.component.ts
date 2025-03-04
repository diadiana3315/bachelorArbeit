import {Component, inject, OnInit} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import {UserService} from '../services/user.service';
import {Auth, signInWithPopup, GoogleAuthProvider, getRedirectResult, signInWithRedirect} from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  errorMessage: string = '';
  userData: any;

  constructor(
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private router: Router
  ) { }



  // login() {
  //   this.afAuth.signInWithEmailAndPassword(this.email, this.password)
  //     .then((userCredential) => {
  //       const userId = userCredential.user?.uid;
  //       if (userId) {
  //         // Use getUser to fetch user data
  //         this.userService.getUser(userId).subscribe((doc) => {
  //           if (doc.exists) {
  //             this.userData = doc.data(); // Store user data
  //             console.log('User data:', this.userData);
  //             this.router.navigate(['/homepage']);
  //           } else {
  //             this.errorMessage = 'User data not found.';
  //           }
  //         });
  //       }
  //     })
  //
  //     .catch((error) => {
  //       this.errorMessage = error.message;
  //     });
  // }

  login() {
    this.afAuth.signInWithEmailAndPassword(this.email, this.password)
      .then((userCredential) => {
        const userId = userCredential.user?.uid;
        if (userId) {
          this.userService.updateLastLogin(userId) // Update last login time
            .then(() => this.router.navigate(['/homepage']))
            .catch(error => console.error("Failed to update last login:", error));
        }
      })
      .catch((error) => {
        this.errorMessage = (error as Error).message;
      });
  }

  // async loginWithGoogle() {
  //   try {
  //     const provider = new GoogleAuthProvider();
  //     await signInWithRedirect(this.auth, provider);
  //   } catch (error) {
  //     this.errorMessage = error instanceof Error ? error.message : 'An error occurred';
  //     console.error("Google Sign-in Error:", error);
  //   }
  // }
  goToRegister() {
    this.router.navigate(['/register']);
  }

  forgotPassword() {
    const email = prompt("Please enter your email address to reset your password:");

    if (email) {
      this.afAuth.sendPasswordResetEmail(email)
        .then(() => {
          alert('Password reset email sent! Check your inbox.');
        })
        .catch((error) => {
          // Handle errors here
          const errorMessage = (error as Error).message;
          this.errorMessage = `Error: ${errorMessage}`;
        });
    }
  }
}
