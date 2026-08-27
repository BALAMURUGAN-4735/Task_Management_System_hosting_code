import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Buffer } from 'buffer';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

(window as any).Buffer = (window as any).Buffer || Buffer;
(window as any).global = (window as any).global || window;