import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { APP_BASE_HREF } from '@angular/common';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
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
import { catchError, Observable } from 'rxjs';
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

export function unauthorizedInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    catchError((error) => {
      if (!req.url.endsWith("/users/me") && error.status === 401) {
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
    { provide: APP_BASE_HREF, useValue: '/third-party/web' },
    importProvidersFrom(
      UsersApiModule.forRoot(usersApiConfigFactory),
      ThirdPartyBffApiModule.forRoot(thirPartyBffApiConfigFactory)
    ),
  ],
};
