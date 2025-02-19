import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import {AngularFirestore} from '@angular/fire/compat/firestore';
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
          // Use getUser to fetch user data
          this.userService.getUser(userId).subscribe((doc) => {
            if (doc.exists) {
              this.userData = doc.data(); // Store user data
              console.log('User data:', this.userData);
              this.router.navigate(['/homepage']);
            } else {
              this.errorMessage = 'User data not found.';
            }
          });
        }
      })

      .catch((error) => {
        this.errorMessage = error.message;
      });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
