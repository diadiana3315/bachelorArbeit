import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  isValid(): boolean {
    return this.password === this.confirmPassword && this.password.length >= 6;
  }

  register() {
    if (this.isValid()) {
      this.afAuth.createUserWithEmailAndPassword(this.email, this.password)
        .then(() => {
          this.router.navigate(['/homepage']);
        })
        .catch((error) => {
          this.errorMessage = error.message;
        });
    } else {
      this.errorMessage = 'Passwords do not match or are too short.';
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
