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

import {
  HttpHandlerFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export function uiBffApiConfigFactory() {
  const params: UiBffApiConfigurationParameters = {
    basePath: environment.bffBaseUrl,
  };
  return new UiBffApiConfiguration(params);
}

export function usersApiConfigFactory() {
  const params: UsersApiConfigurationParameters = {
    basePath: environment.bffBaseUrl,
  };
  return new UsersApiConfiguration(params);
}

export function unauthorizedInterceptor(exceptions: string[]) {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    return next(req).pipe(
      catchError((error) => {
        if (error.status === 401) {
          if (
            !exceptions.find(
              (url) =>
                req.url === url || req.url === environment.bffBaseUrl + url
            )
          ) {
            window.location.href =
              environment.bffBaseUrl +
              '/oauth2/authorization/ui?post_login_success_uri=' +
              encodeURIComponent(location.toString());
          }
        }
        throw error;
      })
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([unauthorizedInterceptor(['/users/me'])])
    ),
    { provide: APP_BASE_HREF, useValue: '/ui/web' },
    importProvidersFrom(
      UiBffApiModule.forRoot(uiBffApiConfigFactory),
      UsersApiModule.forRoot(usersApiConfigFactory)
    ),
  ],
};
