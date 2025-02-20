import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import {AngularFireAuthModule} from '@angular/fire/compat/auth';
import {environment} from '../environments/environment';
import {AngularFireModule} from '@angular/fire/compat';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomepageComponent } from './homepage/homepage.component';
import {FormsModule} from '@angular/forms';
import { NavbarComponent } from './navbar/navbar.component';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import { SidenavComponent } from './sidenav/sidenav.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProfileComponent } from './profile/profile.component';
import { LibraryComponent } from './library/library.component';
import { AddButtonComponent } from './add-button/add-button.component';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule} from '@angular/material/dialog';
import {AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {AngularFireStorageModule} from '@angular/fire/compat/storage';
import { FileViewerComponent } from './file-viewer/file-viewer.component';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';

// import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
// import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomepageComponent,
    NavbarComponent,
    SidenavComponent,
    ProfileComponent,
    LibraryComponent,
    AddButtonComponent,
    FileViewerComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFireStorageModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    FormsModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    BrowserAnimationsModule,
    MatMenuModule,
    MatDialogModule,
    AngularFirestoreModule,
    NgxExtendedPdfViewerModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
