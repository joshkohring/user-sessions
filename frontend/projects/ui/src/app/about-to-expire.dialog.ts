import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-about-to-expire',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <mat-dialog-content>Your session is about to expire.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="true">Keep alive</button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class AboutToExpireDialog {}
