import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'custom-datepicker-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-datepicker-footer mat-datepicker-actions">
      <!-- Footer actions removed as requested -->
    </div>
  `,
  styles: [
    `.custom-datepicker-footer { display:block; padding:4px 8px; }`,
  ],
})
export class CustomDatepickerFooter {}
