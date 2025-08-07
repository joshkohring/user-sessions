import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  Configuration as ThirdPartyBffApiConfiguration,
  ConfigurationParameters as ThirdPartyBffApiConfigurationParameters,
  ApiModule as ThirdPartyBffApiModule,
} from '@c4-soft/third-party-bff-api';
import {
  Configuration as UsersApiConfiguration,
  ConfigurationParameters as UsersApiConfigurationParameters,
  ApiModule as UsersApiModule,
} from '@c4-soft/users-api';
import { routes } from './app.routes';

export function thirPartyBffApiConfigFactory(): ThirdPartyBffApiConfiguration {
  const params: ThirdPartyBffApiConfigurationParameters = {
    basePath: 'https://localhost/third-party/bff',
  };
  return new ThirdPartyBffApiConfiguration(params);
}

export function usersApiConfigFactory(): UsersApiConfiguration {
  const params: UsersApiConfigurationParameters = {
    basePath: 'https://localhost/third-party/bff',
  };
  return new UsersApiConfiguration(params);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: APP_BASE_HREF, useValue: '/third-party/web' },
    importProvidersFrom(UsersApiModule.forRoot(usersApiConfigFactory), ThirdPartyBffApiModule.forRoot(thirPartyBffApiConfigFactory)),
  ],
};
