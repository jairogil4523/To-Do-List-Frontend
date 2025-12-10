import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

export interface SuccessModalData {
  title?: string;
  message?: string;
  logoSrc?: string;
}

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-modal.html',
  styleUrls: ['./success-modal.css']
})
export class SuccessModal {
  constructor(
    public dialogRef: MatDialogRef<SuccessModal>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessModalData
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
