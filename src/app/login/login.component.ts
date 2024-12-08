import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  login() {
    this.afAuth.signInWithEmailAndPassword(this.email, this.password)
      .then(() => {
        this.router.navigate(['/homepage']);
      })
      .catch((error) => {
        this.errorMessage = error.message;
      });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
