import { CommonModule } from '@angular/common';
import { Component, signal, Signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { SessionInfo } from '@c4-soft/third-party-bff-api';
import { PingApi } from '@c4-soft/users-api';
import { interval, map, Observable } from 'rxjs';
import { User, UserService } from './user.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, RouterOutlet, MatButtonModule],
  template: `
    <h1>Third Party</h1>
    <table>
      <tr>
        <td>user</td>
        <td>{{ currentUser()?.name }}</td>
      </tr>
      <tr>
        <td>session ID</td>
        <td>{{ (sessionInfo$ | async)?.sessionId }}</td>
      </tr>
      <tr>
        <td>User session expires in:</td>
        <td>{{ userSessionExpiresIn() }}@if(userSessionExpiresIn()) { s}</td>
      </tr>
      <tr>
        <td>BFF session expires in:</td>
        <td>{{ bffSessionExpiresIn() }}@if(bffSessionExpiresIn()) { s}</td>
      </tr>
      <tr>
        <td>Access token expires in:</td>
        <td>{{ accessTokenExpiresIn() }}@if(accessTokenExpiresIn()) { s}</td>
      </tr>
      <tr>
        <td>Session last accessed at:</td>
        <td>{{ bffSessionLastAccessed() | date : DATE_FMT }}</td>
      </tr>
      <tr>
        <td>current time</td>
        <td>{{ clock() | date : DATE_FMT }}</td>
      </tr>
    </table>

    <div class="mt-2">
      <button mat-button (click)="ping()">Ping</button> uses an access token
      (refreshes it if expired or expires within the current minute)
      <div>{{ message() }}</div>
    </div>

    @if (currentUser()?.isAuthenticated) {
    <div class="mt-2">
      <button mat-button (click)="user.refreshSessionInfo()">
        Force user session info refresh
      </button>
    </div>
    <button mat-button (click)="user.logout()">Logout</button>
    } @else {
    <button mat-button (click)="user.login()">Login</button>
    }

    <router-outlet />
  `,
  styles: [],
})
export class App {
  protected readonly DATE_FMT = 'yyyy MM dd HH:mm:ss z';
  protected readonly currentUser: Signal<User | undefined>;
  protected readonly clock = signal(new Date());
  protected readonly userSessionExpiresIn: WritableSignal<number | undefined> =
    signal(undefined);
  protected readonly bffSessionExpiresIn: WritableSignal<number | undefined> =
    signal(undefined);
  protected readonly accessTokenExpiresIn: WritableSignal<number | undefined> =
    signal(undefined);
  protected readonly sessionInfo$: Observable<SessionInfo>;
  protected readonly message = signal<string>('');
  protected readonly bffSessionLastAccessed: Signal<Date | undefined>;

  constructor(readonly user: UserService, readonly pingApi: PingApi) {
    this.currentUser = toSignal(user.valueChanges);

    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const now = new Date();
        this.clock.set(now);
        this.userSessionExpiresIn.set(
          user.currentSession?.userSessionExp
            ? Math.round(
                user.currentSession.userSessionExp - now.getTime() / 1000
              )
            : undefined
        );
        this.bffSessionExpiresIn.set(
          user.currentSession?.bffSessionExp
            ? Math.round(
                user.currentSession.bffSessionExp - now.getTime() / 1000
              )
            : undefined
        );
        this.accessTokenExpiresIn.set(
          user.currentSession?.accessTokenExp
            ? Math.round(
                user.currentSession.accessTokenExp - now.getTime() / 1000
              )
            : undefined
        );
      });

    this.sessionInfo$ = user.sessionChanges;
    this.bffSessionLastAccessed = toSignal(
      user.sessionChanges.pipe(
        map((sessionInfo) => this.toDate(sessionInfo.bffSessionLastAccessed))
      )
    );
  }

  ping() {
    this.message.set('Pinging...');

    this.pingApi.ping().subscribe({
      next: (pong) => {
        this.message.set(pong.message || '');
        this.user.refreshSessionInfo();
      },
      error: (error) => {
        console.warn(error);
        this.message.set('error');
        this.user.refreshSessionInfo();
      },
    });
  }

  protected toDate(seconds: number | undefined): Date | undefined {
    return seconds ? new Date(seconds * 1000) : undefined;
  }
}
