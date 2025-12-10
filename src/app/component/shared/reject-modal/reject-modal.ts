import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RejectModalData {
  title?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-reject-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reject-modal.html',
  styleUrls: ['./reject-modal.css']
})
export class RejectModal {
  reason: string = '';
  @ViewChild('reasonArea') reasonArea!: ElementRef<HTMLTextAreaElement>;

  ngAfterViewInit(): void {
    try { this.reasonArea?.nativeElement?.focus(); } catch { }
  }
  submitted: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<RejectModal>,
    @Inject(MAT_DIALOG_DATA) public data: RejectModalData
  ) {}

  onCancel() {
    this.dialogRef.close({ confirmed: false });
  }

  onReject() {
    this.submitted = true;
    const r = (this.reason || '').trim();
    if (!r) return; // defensa adicional
    this.dialogRef.close({ confirmed: true, reason: r });
  }
}
