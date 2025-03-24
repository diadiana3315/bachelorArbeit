import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import {enableProdMode} from '@angular/core';
import {environment} from './environments/environment';
import {ServiceWorkerModule} from '@angular/service-worker';


if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));

if (environment.production) {
  ServiceWorkerModule.register('ngsw-worker.js');
}
