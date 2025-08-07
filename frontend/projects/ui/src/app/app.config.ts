import { APP_BASE_HREF } from '@angular/common';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  Configuration as UiBffApiConfiguration,
  ConfigurationParameters as UiBffApiConfigurationParameters,
  ApiModule as UiBffApiModule,
} from '@c4-soft/ui-bff-api';
import {
  Configuration as UsersApiConfiguration,
  ConfigurationParameters as UsersApiConfigurationParameters,
  ApiModule as UsersApiModule,
} from '@c4-soft/users-api';

import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export function uiBffApiConfigFactory(): UiBffApiConfiguration {
  const params: UiBffApiConfigurationParameters = {
    basePath: 'https://localhost/ui/bff',
  };
  return new UiBffApiConfiguration(params);
}

export function usersApiConfigFactory(): UsersApiConfiguration {
  const params: UsersApiConfigurationParameters = {
    basePath: 'https://localhost/ui/bff',
  };
  return new UsersApiConfiguration(params);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: APP_BASE_HREF, useValue: '/ui/web' },
    importProvidersFrom(UiBffApiModule.forRoot(uiBffApiConfigFactory), UsersApiModule.forRoot(usersApiConfigFactory)),
  ],
};
