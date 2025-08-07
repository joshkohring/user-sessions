import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { UsersApi } from '@c4-soft/users-api';
import { finalize, interval, Subscription, take, timer } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user$ = new BehaviorSubject<User>(User.ANONYMOUS);
  private userEventsSubscription?: Subscription;

  private readonly defaultExp = 30000;
  private refreshInTimerSubscription?: Subscription;

  keepAlive = signal(true);
  refreshIn: WritableSignal<number | null> = signal(null);

  constructor(private usersApi: UsersApi, private http: HttpClient) {
    this.refresh();
  }

  refresh(isKeepAlive = false): void {
    this.userEventsSubscription?.unsubscribe();
    this.refreshInTimerSubscription?.unsubscribe();

    if (isKeepAlive && !this.keepAlive) {
      return;
    }

    this.usersApi.getMe().subscribe({
      next: (user) => {
        const now = new Date().getTime();
        const exp =
          user.exp && user.exp <= Number.MAX_SAFE_INTEGER
            ? user.exp * 1000
            : now + 2 * this.defaultExp;
        this.user$.next(
          user.sub
            ? new User(
                user.sub,
                user.preferredUsername,
                user.roles || [],
                user.email || null,
                new Date(exp)
              )
            : User.ANONYMOUS
        );
        const millis = exp - now - this.defaultExp;
        if (this.keepAlive() && millis > 0) {
          this.refreshIn.set(millis);
          this.countDown();
          this.userEventsSubscription = interval(millis)
            .pipe(take(1))
            .subscribe(() => this.refresh(true));
        }
      },
      error: (error) => {
        console.warn(error);
        this.user$.next(User.ANONYMOUS);
        this.userEventsSubscription = interval(this.defaultExp)
          .pipe(take(1))
          .subscribe(() => this.refresh());
      },
    });
  }

  private countDown() {
    this.refreshInTimerSubscription = timer(1000).subscribe(() => {
      if (this.refreshIn() !== null) {
        this.refreshIn.set(this.refreshIn()! - 1000);
        if (this.refreshIn()! < 1) {
          this.refreshIn.set(null);
        } else {
          this.countDown();
        }
      }
    });
  }

  login() {
    const currentRoute = location.toString();
    this.http
      .get('/ui/bff/oauth2/authorization/ui', {
        headers: {
          'X-RESPONSE-STATUS': '200',
          'X-POST-LOGIN-SUCCESS-URI': currentRoute,
          'X-POST-LOGIN-FAILURE-URI': currentRoute,
        },
        observe: 'response',
      })
      .subscribe((resp) => {
        const location = resp.headers.get('Location');
        if (!!location) {
          window.location.href = location;
        }
      });
  }

  private getXsrfToken(): string {
    const cookies = document.cookie.split('; ');
    const xsrfCookie = cookies.find((cookie) =>
      cookie.startsWith('XSRF-TOKEN=')
    );
    const xsrfToken = xsrfCookie ? xsrfCookie.split('=')[1] : '';
    return xsrfToken;
  }

  logout() {
    this.userEventsSubscription?.unsubscribe();
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
        if (!!logoutUri) {
          window.location.href = logoutUri;
        }
      });
  }

  get valueChanges(): Observable<User> {
    return this.user$;
  }

  get current(): User {
    return this.user$.value;
  }
}

export class User {
  static readonly ANONYMOUS = new User('', '', [], null);

  constructor(
    readonly sub: string,
    readonly name: string,
    readonly roles: string[],
    readonly email: string | null,
    readonly accessUntil?: Date
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
