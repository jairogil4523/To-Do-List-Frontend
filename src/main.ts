/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { importProvidersFrom } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIconsModule } from '@ng-icons/core';
import {
  bootstrapAlarm,
  bootstrapCheckCircle,
} from '@ng-icons/bootstrap-icons';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    importProvidersFrom(
      NgbModule,
      NgIconsModule.withIcons({ bootstrapAlarm, bootstrapCheckCircle })
    ),
  ],
}).catch((err) => {});
