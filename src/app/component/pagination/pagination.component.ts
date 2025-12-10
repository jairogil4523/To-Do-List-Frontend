import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PaginationResponse, PaginationConfig } from '../../model/pagination/pagination.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule],
  template: `
    <mat-paginator
      [length]="paginationData?.totalElements || 0"
      [pageSize]="config.defaultPageSize"
      [pageSizeOptions]="config.pageSizeOptions"
      [showFirstLastButtons]="config.showFirstLastButtons"
      (page)="onPageChange($event)">
    </mat-paginator>
  `
})
export class PaginationComponent {
  @Input() paginationData: PaginationResponse<any> | null = null;
  @Input() config: PaginationConfig = {
    pageSizeOptions: [5, 10, 25, 50],
    defaultPageSize: 10,
    showFirstLastButtons: true
  };
  
  @Output() pageChange = new EventEmitter<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}