import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatNativeDateModule } from '@angular/material/core';
import { CustomDatepickerHeader } from '../picker/custom-datepicker-header';
import { RegonalesService } from '../../service/regionales/reginales.service';
import { ReporteService } from '../../service/reporte/reporte.service';
import { JefeService } from '../../service/jefe/jefe.service';
import { AuthService } from '../../service/auth/auth.service';
import { IReporte } from '../../model/Reporte/reporte_model';

@Component({
  selector: 'app-reportes',
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatNativeDateModule,
    CustomDatepickerHeader,
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit, AfterViewInit {
  filtroTipo = '';
  filtroRegional = '';
  filtroColaborador = '';
  filtroJefe = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  isLoading = false;
  dataSource = new MatTableDataSource<IReporte>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  tipos: string[] = ['Tiempos Registrados', 'Bitácora Estados'];
  regionales: any[] = [];
  colaboradores: string[] = [];
  jefes: any[] = [];

  minDate = new Date(2020, 0, 1);
  maxDate = new Date();
  startAt = new Date();
  CustomDatepickerHeader = CustomDatepickerHeader;

  columnDefs: { def: string; header: string; pipe?: string; badge?: boolean }[] = [];
  displayedColumns: string[] = [];

  tiempoColumns = [
    { def: 'documento', header: 'Documento' },
    { def: 'nombreColaborador', header: 'Colaborador' },
    { def: 'nombreJefe', header: 'Jefe Inmediato' },
    { def: 'regional', header: 'Regional' },
    { def: 'gestion', header: 'Gestión' },
    { def: 'proceso', header: 'Proceso' },
    { def: 'tipohora', header: 'Tipo Hora' },
    { def: 'justificacion', header: 'Justificación' },
    { def: 'fechainicio', header: 'Fecha Inicio', pipe: 'dd/MM/yyyy' },
    { def: 'fechafin', header: 'Fecha Fin', pipe: 'dd/MM/yyyy' },
    { def: 'horainicio', header: 'Hora Inicio' },
    { def: 'horafin', header: 'Hora Fin' },
    { def: 'cantidadHoras', header: 'Cantidad Horas' }
  ];

  bitacoraColumns = [
    { def: 'nombreColaborador', header: 'Colaborador' },
    { def: 'motivoRechazoJefe', header: 'Motivo Rechazo Jefe' },
    { def: 'motivoRechazoGh', header: 'Motivo Rechazo GH' },
    { def: 'estadojefe', header: 'Estado Jefe', badge: true },
    { def: 'estadogh', header: 'Estado GH', badge: true },
    { def: 'estadopago', header: 'Estado Pago', badge: true },
    { def: 'fechamodificacion', header: 'Fecha Modificación', pipe: 'dd/MM/yyyy' }
  ];
  resultsLength = 0;

  constructor(
    private regionalesService: RegonalesService,
    private reporteService: ReporteService,
    private jefeService: JefeService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadRegionales();
    this.updateColumns();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private loadRegionales() {
    this.regionalesService.getAll().subscribe({
      next: (regionales) => {
        this.regionales = regionales;
      },
      error: () => {
        this.regionales = [];
      },
    });
  }

  private loadJefes(regionalId: number) {
    const role = this.authService.getRole()?.trim() || 'ovtcolaboradormp';
    this.jefeService.getJefes(role, regionalId).subscribe({
      next: (jefes) => {
        this.jefes = jefes;
      },
      error: () => {
        this.jefes = [];
      },
    });
  }

  onFilterChange() {
    const regionalId = this.regionales.find(r => r.nombre === this.filtroRegional)?.id;
    if (regionalId) {
      this.loadJefes(regionalId);
    } else {
      this.jefes = [];
      this.filtroJefe = '';
    }
    this.updateColumns();
    this.cargarReportes();
  }

  onFechaChange() {
    if (this.fechaInicio && this.fechaFin) {
      this.cargarReportes();
    }
  }

  openPicker(type: string, picker: any) {
    picker.open();
  }

  limpiarFiltros() {
    this.filtroTipo = '';
    this.filtroRegional = '';
    this.filtroColaborador = '';
    this.filtroJefe = '';
    this.fechaInicio = null;
    this.fechaFin = null;
    this.dataSource.data = [];
    this.updateColumns();
  }

  private updateColumns() {
    if (this.filtroTipo === 'Bitácora Estados') {
      this.columnDefs = this.bitacoraColumns;
      this.displayedColumns = this.bitacoraColumns.map(col => col.def);
    } else {
      this.columnDefs = this.tiempoColumns;
      this.displayedColumns = this.tiempoColumns.map(col => col.def);
    }
  }

  private cargarReportes() {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.isLoading = true;
    
    const fechaInicioStr = this.fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = this.fechaFin.toISOString().split('T')[0];
    
    const regionalId = this.regionales.find(r => r.nombre === this.filtroRegional)?.id;
    
    const serviceCall = this.filtroTipo === 'Bitácora Estados' 
      ? this.reporteService.getBitacora(
          regionalId?.toString(),
          this.filtroJefe || undefined,
          fechaInicioStr,
          fechaFinStr
        )
      : this.reporteService.getTiempo(
          regionalId?.toString(),
          this.filtroJefe || undefined,
          fechaInicioStr,
          fechaFinStr
        );
    
    serviceCall.subscribe({
      next: (reportes) => {
        console.log('Datos recibidos:', reportes);
        this.dataSource.data = reportes;
        this.resultsLength = reportes.length;
        this.isLoading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.resultsLength = 0;
        this.isLoading = false;
      }
    });
  }

  descargarReporte() {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    const fechaInicioStr = this.fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = this.fechaFin.toISOString().split('T')[0];
    const regionalId = this.regionales.find(r => r.nombre === this.filtroRegional)?.id;

    const downloadCall = this.filtroTipo === 'Bitácora Estados'
      ? this.reporteService.getDescargarBitacora(
          regionalId?.toString(),
          this.filtroJefe || undefined,
          fechaInicioStr,
          fechaFinStr
        )
      : this.reporteService.getDescargarTiempo(
          regionalId?.toString(),
          this.filtroJefe || undefined,
          fechaInicioStr,
          fechaFinStr
        );

    const fileName = this.filtroTipo === 'Bitácora Estados' 
      ? 'bitacora_estados.csv' 
      : 'tiempos_registrados.csv';

    downloadCall.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        console.error('Error al descargar el reporte');
      }
    });
  }
}
