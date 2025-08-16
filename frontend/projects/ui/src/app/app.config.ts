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
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
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

export function unauthorizedInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        window.location.href =
          '/third-party/bff/oauth2/authorization/third-party?post_login_success_uri=' +
          encodeURIComponent(location.toString());
      }
      throw error;
    })
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([unauthorizedInterceptor])),
    { provide: APP_BASE_HREF, useValue: '/ui/web' },
    importProvidersFrom(
      UiBffApiModule.forRoot(uiBffApiConfigFactory),
      UsersApiModule.forRoot(usersApiConfigFactory)
    ),
  ],
};
