import {Component, inject, OnInit} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import {UserService} from '../services/user.service';

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
          const errorMessage = (error as Error).message;
          this.errorMessage = `Error: ${errorMessage}`;
        });
    }
  }
}
