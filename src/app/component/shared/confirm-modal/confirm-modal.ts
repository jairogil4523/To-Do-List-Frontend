import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

export interface ConfirmModalData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrls: ['./confirm-modal.css']
})
export class ConfirmModal {
  constructor(
    public dialogRef: MatDialogRef<ConfirmModal>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmModalData
  ) {}

  onCancel() {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm() {
    this.dialogRef.close({ confirmed: true });
  }
}
