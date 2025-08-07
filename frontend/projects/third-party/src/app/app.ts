import { CommonModule } from '@angular/common';
import { Component, computed, signal, Signal } from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { SessionInfo, ThirdPartyBffSessionsApi } from '@c4-soft/third-party-bff-api';
import { interval, map, mergeMap, Observable } from 'rxjs';
import { User, UserService } from './user.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, RouterOutlet],
  template: `
    <h1>Third Party</h1>
    <p>{{ clock() | date : DATE_FMT }}</p>

    @if (currentUser()?.isAuthenticated) {
    <h2>User</h2>
    <p>{{ currentUser()?.name }}</p>
    <p>
      <span>Access until: </span>
      <span>{{ currentUser()?.accessUntil | date : DATE_FMT }}</span>
    </p>

    <h2>BFF session</h2>
    <table>
      <tr>
        <td>ID:</td>
        <td>{{ sessionInfo()?.sessionId }}</td>
      </tr>
      <tr>
        <td>creation:</td>
        <td>{{ toDate(sessionInfo()?.createdAt) | date : DATE_FMT }}</td>
      </tr>
      <tr>
        <td>last access:</td>
        <td>{{ toDate(sessionInfo()?.lastAccessedAt) | date : DATE_FMT }}</td>
      </tr>
      <tr>
        <td>max inactive interval:</td>
        <td>
          {{ sessionInfo()?.maxInactiveInterval }}s ({{
            maxInactiveMinutes()
          }}
          minutes)
        </td>
      </tr>
      <tr>
        <td>access token issued at:</td>
        <td>{{ toDate(sessionInfo()?.accessIat) | date : DATE_FMT }}</td>
      </tr>
      <tr>
        <td>access token expires at:</td>
        <td>{{ toDate(sessionInfo()?.accessExp) | date : DATE_FMT }}</td>
      </tr>
      <tr>
        <td>refresh token issued at:</td>
        <td>{{ toDate(sessionInfo()?.refreshIat) | date : DATE_FMT }}</td>
      </tr>
      <tr>
        <td>refresh token expires at:</td>
        <td>{{ toDate(sessionInfo()?.refreshExp) | date : DATE_FMT }}</td>
      </tr>
    </table>

    <h2>Keep alive</h2>
    <p>
      <input type="checkbox" [formControl]="keepAliveControl" />
      refresh in {{ refreshIn$ | async }}s
    </p>
    <button (click)="user.logout()">Logout</button>
    } @else {
    <button (click)="user.login()">Login</button>
    }

    <router-outlet />
  `,
  styles: [],
})
export class App {
  protected readonly DATE_FMT = 'yyyy MM dd HH:mm:ss z';
  protected readonly currentUser: Signal<User | undefined>;
  protected readonly keepAliveControl = new FormControl(true);
  protected readonly clock = signal(new Date());
  protected refreshIn$: Observable<number | null>;
  protected sessionInfo: Signal<SessionInfo | undefined> = signal(undefined);
  protected maxInactiveMinutes: Signal<number | undefined>;

  constructor(readonly user: UserService, sessionInfoApi: ThirdPartyBffSessionsApi) {
    this.currentUser = toSignal(user.valueChanges);
    this.keepAliveControl.setValue(user.keepAlive());
    this.keepAliveControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((keepAlive) => {
        this.user.keepAlive.set(keepAlive || false);
        this.user.refreshIn.set(null);
        this.user.refresh(true);
      });
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.clock.set(new Date());
      });
    this.refreshIn$ = toObservable(user.refreshIn).pipe(
      map((r) => (r ? Math.round(r / 1000) : null))
    );

    this.sessionInfo = toSignal(
      user.valueChanges.pipe(
        mergeMap((user) => sessionInfoApi.getSessionInfo())
      )
    );
    this.maxInactiveMinutes = computed(() => {
      const maxInactiveInterval = this.sessionInfo()?.maxInactiveInterval;
      return maxInactiveInterval
        ? Math.round(maxInactiveInterval / 60)
        : undefined;
    });
  }

  protected toDate(millis: number | undefined): Date | undefined {
    return millis ? new Date(millis) : undefined;
  }
}
