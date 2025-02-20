import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {HomepageComponent} from './homepage/homepage.component';
import {ProfileComponent} from './profile/profile.component';
import {LibraryComponent} from './library/library.component';
import {FileViewerComponent} from './file-viewer/file-viewer.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'homepage', component: HomepageComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'library', component: LibraryComponent },
  { path: 'viewer', component: FileViewerComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
