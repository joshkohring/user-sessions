import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogState,
} from '@angular/material/dialog';
import { SessionInfo, UiBffSessionsApi } from '@c4-soft/ui-bff-api';
import { PingApi, UsersApi } from '@c4-soft/users-api';
import { finalize, timer } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { AboutToExpireDialog } from './about-to-expire.dialog';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly user$ = new BehaviorSubject<User>(User.ANONYMOUS);
  private readonly sessionInfo$ = new BehaviorSubject<SessionInfo>({ name: '' });
  private aboutToExpireDialog?: MatDialogRef<AboutToExpireDialog>;

  constructor(
    private usersApi: UsersApi,
    private pingApi: PingApi,
    private sessionsApi: UiBffSessionsApi,
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    this.refresh();
  }

  refresh(): void {
    this.usersApi.getMe().subscribe({
      next: (user) =>
        this.usersApi.getOpSession().subscribe({
          next: (opSession) => {
            if (!user.sub) {
              this.user$.next(User.ANONYMOUS);
            } else {
              this.user$.next(
                new User(
                  user.sub,
                  user.preferredUsername,
                  user.roles || [],
                  user.email || null,
                  opSession.idle ? new Date(opSession.idle * 1000) : undefined,
                  opSession.max ? new Date(opSession.max * 1000) : undefined,
                )
              );
              this.refreshSessionInfo();
            }
          },
          error: (error) => {
            console.warn(error);
            this.user$.next(User.ANONYMOUS);
          },
        }),
      error: (error) => {
        console.warn(error);
        this.user$.next(User.ANONYMOUS);
      },
    });
  }

  refreshSessionInfo() {
    this.sessionsApi.getSessionInfo().subscribe({
      next: (sessionInfo) => {
        this.sessionInfo$.next(sessionInfo);
        if (sessionInfo.name) {
          const now = Date.now();
          const userSessionExpiresIn = Math.round(
            (sessionInfo.userSessionExp || 0) * 1000 - now
          );
          if (userSessionExpiresIn > 0) {
            if (userSessionExpiresIn > 30000) {
              timer(userSessionExpiresIn - 30000).subscribe(() => {
                if (
                  !this.aboutToExpireDialog ||
                  this.aboutToExpireDialog?.getState() === MatDialogState.CLOSED
                ) {
                  this.aboutToExpireDialog =
                    this.dialog.open(AboutToExpireDialog);
                  this.aboutToExpireDialog
                    .afterClosed()
                    .subscribe((keepAlive) => {
                      if (keepAlive) {
                        this.pingApi.ping().subscribe({
                          next: () => {
                            this.refreshSessionInfo();
                          },
                          error: () => {
                            if (this.current.isAuthenticated) {
                              this.user$.next(User.ANONYMOUS);
                            }
                            this.refreshSessionInfo();
                          },
                        });
                      } else {
                        this.logout(false);
                      }
                    });
                }
              });
            }
            timer(userSessionExpiresIn).subscribe(() =>
              this.aboutToExpireDialog?.close()
            );
          }
        }
      },
      error: (error) => {
        console.warn(error);
        this.sessionInfo$.next({ name: '' });
        this.user$.next(User.ANONYMOUS);
      },
    });
  }

  login() {
    window.location.href =
      '/ui/bff/oauth2/authorization/ui?post_login_success_uri=' +
      encodeURIComponent(location.toString());
  }

  private getXsrfToken(): string {
    const cookies = document.cookie.split('; ');
    const xsrfCookie = cookies.find((cookie) =>
      cookie.startsWith('XSRF-TOKEN=')
    );
    const xsrfToken = xsrfCookie ? xsrfCookie.split('=')[1] : '';
    return xsrfToken;
  }

  logout(followToOp = true) {
    this.http
      .post('/ui/bff/logout', null, {
        headers: { 'X-XSRF-TOKEN': this.getXsrfToken() },
        observe: 'response',
      })
      .pipe(
        finalize(() => {
          this.user$.next(User.ANONYMOUS);
        })
      )
      .subscribe((resp) => {
        const logoutUri = resp.headers.get('Location');
        if (followToOp && !!logoutUri) {
          window.location.href = logoutUri;
        }
      });
  }

  get valueChanges(): Observable<User> {
    return this.user$;
  }

  get sessionChanges(): Observable<SessionInfo> {
    return this.sessionInfo$;
  }

  get current(): User {
    return this.user$.value;
  }

  get currentSession(): SessionInfo {
    return this.sessionInfo$.value;
  }
}

export class User {
  static readonly ANONYMOUS = new User('', '', [], null, undefined, undefined);

  constructor(
    readonly sub: string,
    readonly name: string,
    readonly roles: string[],
    readonly email: string | null,
    readonly ssoSessionIdleAt?: Date,
    readonly ssoSessionMaxAt?: Date
  ) {}

  get isAuthenticated(): boolean {
    return !!this.sub;
  }

  hasAnyRole(...roles: string[]): boolean {
    for (let r of roles) {
      if (this.roles.includes(r)) {
        return true;
      }
    }
    return false;
  }

  get isTrainer(): boolean {
    return this.hasAnyRole('trainer');
  }

  get isModerator(): boolean {
    return this.hasAnyRole('moderator');
  }
}
