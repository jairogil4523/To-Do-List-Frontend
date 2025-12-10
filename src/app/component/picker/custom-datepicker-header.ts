import { Component, ChangeDetectorRef, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCalendar } from '@angular/material/datepicker';
import { DateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'custom-datepicker-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="custom-datepicker-header">
      <div class="header-top">{{ displayActiveDateLarge() }}</div>
      <div class="nav-row">
        <button
          mat-icon-button
          (click)="previousClicked()"
          aria-label="Mes anterior"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <div class="today-label">{{ todayLabel }}</div>
        <div class="spacer"></div>
        <button
          mat-icon-button
          (click)="nextClicked()"
          aria-label="Mes siguiente"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
      <!-- actions removed as requested -->
    </div>
  `,
  host: {
    class: 'mat-calendar-header',
  },
  styles: [
    `
      :host {
        display: block;
        padding: 0;
        position: relative;
      }
    `,
    `
      .custom-datepicker-header {
        display: flex;
        flex-direction: column;
        background: transparent;
      }
    `,
    `
      .header-top {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--color-light);
        text-align: center;
        text-transform: capitalize;
      }
    `,
    `
      .nav-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 0;
      }
    `,
    `
      .spacer {
        flex: 1 1 auto;
      }
    `,
    `
      .footer-actions {
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    `,
    `
      .footer-actions .action-center-row {
        display: flex;
        gap: 8px;
      }
    `,
    `
      .footer-actions .action-left {
        color: var(--color-primary);
        font-weight: 700;
      }
    `,
    `
      .footer-actions button {
        text-transform: uppercase;
        font-weight: 700;
      }
    `,
  ],
})
export class CustomDatepickerHeader<D> {
  private _prevSelected: D | null = null;
  todayLabel: string;

  constructor(
    private _calendar: MatCalendar<D>,
    private _dateAdapter: DateAdapter<D>,
    private _cdr: ChangeDetectorRef
  ) {
    // store current selection so we can restore on cancel
    try {
      this._prevSelected = (this._calendar as any).selected ?? null;
    } catch {
      this._prevSelected = null;
    }
    // compute today's label
    const now = new Date();
    try {
      const parts = new Intl.DateTimeFormat('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(now);
      this.todayLabel = parts.charAt(0).toUpperCase() + parts.slice(1);
    } catch {
      this.todayLabel = '';
    }
  }

  previousClicked(): void {
    this._calendar.activeDate = this._dateAdapter.addCalendarMonths(
      this._calendar.activeDate,
      -1
    );
    this._cdr.markForCheck();
  }

  nextClicked(): void {
    this._calendar.activeDate = this._dateAdapter.addCalendarMonths(
      this._calendar.activeDate,
      1
    );
    this._cdr.markForCheck();
  }

  displayActiveDateLarge(): string {
    if (!this._calendar.activeDate) return '';
    try {
      const d = this._dateAdapter.deserialize(
        this._calendar.activeDate
      ) as unknown as Date;
      const formatted = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(d);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return '';
    }
  }
}
