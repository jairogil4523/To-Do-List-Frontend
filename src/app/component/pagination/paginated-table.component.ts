import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { PaginationComponent } from './pagination.component';
import { PaginationRequest, PaginationResponse, PaginationConfig } from '../../model/pagination/pagination.model';
import { UsuarioService } from '../../service/usuarios/usuario.service';
import { IUsuario } from '../../model/usuarios/usuario.model';

@Component({
  selector: 'app-paginated-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, PaginationComponent],
  template: `
    <div class="table-container">
      <mat-table [dataSource]="usuarios" class="mat-elevation-z8">
        <!-- Agregar columnas según tu modelo de usuario -->
        <ng-container matColumnDef="id">
          <mat-header-cell *matHeaderCellDef>ID</mat-header-cell>
          <mat-cell *matCellDef="let usuario">{{usuario.id}}</mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
      </mat-table>

      <app-pagination
        [paginationData]="paginationData"
        [config]="paginationConfig"
        (pageChange)="onPageChange($event)">
      </app-pagination>
    </div>
  `
})
export class PaginatedTableComponent implements OnInit, OnDestroy {
  usuarios: IUsuario[] = [];
  paginationData: PaginationResponse<IUsuario> | null = null;
  displayedColumns: string[] = ['id'];
  
  paginationConfig: PaginationConfig = {
    pageSizeOptions: [5, 10, 25, 50],
    defaultPageSize: 10,
    showFirstLastButtons: true
  };

  private destroy$ = new Subject<void>();

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.paginationData = data;
          this.usuarios = data.content;
        }
      });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    const request: PaginationRequest = {
      page: 0,
      size: this.paginationConfig.defaultPageSize
    };
    this.usuarioService.loadPage(request).subscribe();
  }

  onPageChange(event: PageEvent): void {
    const request: PaginationRequest = {
      page: event.pageIndex,
      size: event.pageSize
    };
    this.usuarioService.loadPage(request).subscribe();
  }
}