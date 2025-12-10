import {
  Component,
  OnInit,
  ViewChild,
  Injectable,
  OnDestroy,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TipoHoraService } from '../../service/tipoHora/tipo-hora.service';
import { ProcesoService } from '../../service/proceso/proceso.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ITiempoRegistrado } from '../../model/tiempoRegistrado/tiempo-registrado.model';
import { FormsModule } from '@angular/forms';
import {
  MatNativeDateModule,
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VerTiempoModal } from '../shared/ver-tiempo-modal/ver-tiempo-modal';
import { ConfirmModal } from '../shared/confirm-modal/confirm-modal';
import { SuccessModal } from '../shared/success-modal/success-modal';
import { RejectModal } from '../shared/reject-modal/reject-modal';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getPaginatorIntlEs } from '../../shared/mat-paginator-intl-es';
import { EditarTiempoModal } from '../shared/editar-tiempo-modal/editar-tiempo-modal';
import { UsuarioService } from '../../service/usuarios/usuario.service';
import { EstadoService } from '../../service/estado/estado.service';
import { AuthService } from '../../service/auth/auth.service';
import { Subject } from 'rxjs';
import { forkJoin } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CustomDatepickerHeader } from '../picker/custom-datepicker-header';

@Injectable()
class AppDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: any): string {
    if (!date) return '';
    const day = this._to2digit(date.getDate());
    const month = this._to2digit(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  override parse(value: any): Date | null {
    if (!value) return null;
    if (typeof value === 'string') {
      // Aceptar formatos como 'dd/MM/yyyy' o 'd/M/yyyy'
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    // Volver al parseo nativo
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp as number);
  }

  private _to2digit(n: number) {
    return n < 10 ? '0' + n : n.toString();
  }
}

const ELEMENT_DATA: ITiempoRegistrado[] = [];

@Component({
  selector: 'app-solicitud-pendiente-gh',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatPaginatorModule,
    MatDialogModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MatPaginatorIntl, useFactory: getPaginatorIntlEs },
  ],
  templateUrl: './solicitud-procesadas.html',
  styleUrls: ['./solicitud-procesadas.css'],
})
export class SolicitudProcesadas implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  resultsLength = 0;
  filterValue = '';
  isLoading = false;
  fechaInicial: string | null = null;
  fechaFinal: string | null = null;

  // Listas para filtros
  colaboradores: string[] = [];
  jefesInmediatos: string[] = [];

  // Filtros seleccionados
  filtroColaborador = '';
  filtroJefeInmediato = '';

  // Custom datepicker header
  CustomDatepickerHeader = CustomDatepickerHeader;

  displayedColumns: string[] = [
    'nombreColaborador',
    'nombreJefeInmediato',
    // 'estadoGh',
    // 'estadoPago',
    'tipoHora',
    'fechaHoraInicio',
    'fechaHoraFin',
    'estadoJefe',
    'acciones',
  ];

  dataSource = new MatTableDataSource<ITiempoRegistrado>(ELEMENT_DATA);
  tipoHoraMap: Map<string, string> = new Map();
  procesoMap: Map<string, string> = new Map();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pickerService: any = { current: null };

  // Propiedades para datepicker
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  minDate: Date | null = null;
  maxDate: Date | null = null;
  startAt: Date | null = null;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private usuarioService: UsuarioService,
    private tipoHoraService: TipoHoraService,
    private procesoService: ProcesoService,
    private estadoService: EstadoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this._initDateLimits();
    this.loadCatalogData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCatalogData() {
    const tipoHora$ = this.tipoHoraService.getTipoHoras().pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$)
    );
    const proceso$ = this.procesoService.getProcesos().pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$)
    );

    forkJoin({ tiposHora: tipoHora$, procesos: proceso$ }).subscribe({
      next: ({ tiposHora, procesos }) => {
        this.processCatalogData(tiposHora, procesos);
        this.loadData();
      },
      error: () => {
        this.loadData();
      },
    });
  }

  private processCatalogData(tiposHora: any[], procesos: any[]) {
    this.tipoHoraMap.clear();
    this.procesoMap.clear();

    tiposHora.forEach((tipo: any) => {
      const id = tipo.id || tipo.tipoHoraId;
      const nombre =
        tipo.nombre || tipo.name || tipo.descripcion || String(tipo.id);
      if (id) {
        this.tipoHoraMap.set(String(id), nombre);
      }
    });

    procesos.forEach((proceso: any) => {
      const id = proceso.id || proceso.procesoId;
      const nombre =
        proceso.nombre ||
        proceso.name ||
        proceso.descripcion ||
        String(proceso.id);
      if (id) {
        this.procesoMap.set(String(id), nombre);
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(value: string) {
    this.filterValue = (value || '').trim().toLowerCase();
    this.updateFilter();
  }

  onFilterChange() {
    this.updateFilter();
  }

  openVer(element: ITiempoRegistrado) {
    // Preparar datos completos para el modal incluyendo todos los campos necesarios
    const datosCompletos = {
      ...element,
      documento: element.documento || (element as any).identificacion || '',
      nombreColaborador: element.nombreColaborador || '',
      regionalNombre: (element as any).regional || '',
      nombreJefe: (element as any).jefe || (element as any).nombreJefeInmediato || '',
      tipoHora: element.tipoHora || '',
      fechaInicio: element.fechaHoraInicio,
      fechaFin: element.fechaHoraFin,
      horaInicio: element.fechaHoraInicio,
      horaFin: element.fechaHoraFin,
      proceso: element.proceso || '',
      justificacion: (element as any).justificacion || (element as any).descripcion || '',
      evidencia: element.evidencia || '',
      entregable: (element as any).entregable || '',
      usuarioAplicativo: (element as any).usuarioAplicativo || '',
      estadoJefe: element.estadoJefe || '',
      estadoGh: element.estadoGh || '',
      motivoRechazoJefe: (element as any).motivoRechazoJefe || '',
      motivoRechazoGh: (element as any).motivoRechazoGh || '',
      showEdit: false
    };
    
    const dialogRef = this.dialog.open(VerTiempoModal, {
      width: '1100px',
      maxWidth: '95vw',
      data: datosCompletos,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.action === 'edit') {
      }
    });
  }

  openEditar(element: ITiempoRegistrado) {
    const dialogRef = this.dialog.open(EditarTiempoModal, {
      width: '1100px',
      maxWidth: '95vw',
      data: { ...element, showEdit: true },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.action === 'edit') {
      }
    });
  }

  openConfirmApprove(element: ITiempoRegistrado) {
    if (!this.isElementPending(element)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmModal, {
      width: '520px',
      data: {
        title: '¿Esta seguro que desea APROBAR el registro?',
        message: 'El registro será aprobado después de esta acción.',
        confirmText: 'APROBAR',
        cancelText: 'CANCELAR',
      },
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (!res?.confirmed) return;

        const itemId = this.getItemId(element);
        if (itemId == null) return;

        const payload = { estadoJefe: '2' };
        this.estadoService
          .updateEstado(itemId, payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.removeElementFromTable(element);
              this.showSuccessModal('Registro APROBADO correctamente');
            },
            error: () => {
              // Error handling is managed by the service or interceptor
            },
          });
      });
  }

  openRejectModal(element: ITiempoRegistrado) {
    if (!this.isElementPending(element)) {
      return;
    }

    const dialogRef = this.dialog.open(RejectModal, {
      width: '520px',
      data: {
        title: '¿Esta seguro que desea RECHAZAR el registro?',
        placeholder: 'Mencione el motivo del rechazo',
        confirmText: 'RECHAZAR',
        cancelText: 'CANCELAR',
      },
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (!res?.confirmed) return;

        const itemId = this.getItemId(element);
        if (itemId == null) return;

        const payload: any = { estadoJefe: 'Rechazado' };
        if (res.reason) payload.motivoRechazo = res.reason;

        this.estadoService
          .updateEstado(itemId, payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.removeElementFromTable(element);
              this.showSuccessModal('Registro RECHAZADO correctamente');
            },
            error: () => {
              // Error handling is managed by the service or interceptor
            },
          });
      });
  }

  confirmAndDelete(element: ITiempoRegistrado) {
    if (!this.isElementPending(element)) {
      return;
    }

    const itemId = this.getItemId(element);
    if (itemId == null) return;

    const confirmed = window.confirm(
      '¿Confirma eliminar este registro? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    this.estadoService
      .deleteEstado(itemId, element)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.removeElementFromTable(element);
        },
        error: () => {
          // Error handling is managed by the service or interceptor
        },
      });
  }

  private loadData() {
    this.isLoading = true;
    
    const idColaborador = this.authService.getUserId() ?? 'sevo0401';
    const rol = this.authService.getRole() ?? 'ovtjefe';

    this.estadoService
      .getEstados(idColaborador, rol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.handleDataResponse(data),
        error: () => this.isLoading = false
      });
  }



  private handleDataResponse(data: any) {


    const parsed = this.processData(data || []);
    const filtered = this.filterProcessedRequests(parsed);
    const sorted = this.sortByDateDesc(filtered);

    this.dataSource.data = sorted;
    this.resultsLength = sorted.length;
    this.updateFilterLists(sorted);
    this.updateFilter();
    this.isLoading = false;
  }

  private updateFilterLists(data: ITiempoRegistrado[]) {
    this.colaboradores = [
      ...new Set(
        data
          .map((item) => item.nombreColaborador)
          .filter((name): name is string => !!name && name.trim() !== '')
      ),
    ].sort();
    this.jefesInmediatos = [
      ...new Set(
        data
          .map((item) => (item as any).nombreJefeInmediato)
          .filter((name): name is string => !!name && name.trim() !== '')
      ),
    ].sort();
  }

  private filterProcessedRequests(
    items: ITiempoRegistrado[]
  ): ITiempoRegistrado[] {
    return items.filter((item) => {
      const estado = (item.estadoJefe || '').toString().toLowerCase().trim();
      return (
        estado === 'aprobado' ||
        estado.includes('aprob') ||
        estado === 'rechazado' ||
        estado.includes('rechaz')
      );
    });
  }

  private sortByDateDesc(items: ITiempoRegistrado[]): ITiempoRegistrado[] {
    return items.sort((a, b) => {
      const timeA = a?.fechaHoraInicio
        ? new Date(a.fechaHoraInicio).getTime()
        : 0;
      const timeB = b?.fechaHoraInicio
        ? new Date(b.fechaHoraInicio).getTime()
        : 0;
      return timeB - timeA;
    });
  }



  private resolveProceso(data: any): string {
    // Intentar obtener el ID del proceso desde varios campos posibles
    const procesoId =
      data.procesoId ||
      data.procesoid ||
      data.proceso_id ||
      data.proceso ||
      data.actividad ||
      data.proyecto;

    if (procesoId) {
      // Si tenemos el mapa de procesos y el ID, devolver el nombre
      const nombre = this.procesoMap.get(String(procesoId));
      if (nombre) {
        return nombre;
      }
    }

    // Fallback: intentar obtener el nombre directamente
    const procesoNombre =
      data.procesoNombre ||
      data.proceso_nombre ||
      data.procesonombre ||
      data.proceso ||
      data.actividad;
    if (procesoNombre && typeof procesoNombre === 'string') {
      return procesoNombre;
    }

    // Si es un objeto, intentar extraer el nombre
    if (procesoNombre && typeof procesoNombre === 'object') {
      if (procesoNombre.nombre) return String(procesoNombre.nombre);
      if (procesoNombre.descripcion) return String(procesoNombre.descripcion);
      if (procesoNombre.name) return String(procesoNombre.name);
    }

    // Último recurso: devolver el ID como string
    return procesoId ? String(procesoId) : '';
  }

  private resolveTipoHora(data: any): string {
    // Intentar obtener el ID del tipo de hora desde varios campos posibles
    const tipoHoraId =
      data.tipoHoraId ||
      data.tipohoraid ||
      data.tipo_hora_id ||
      data.tipoHora ||
      data.tipo_hora ||
      data.tipohora;

    if (tipoHoraId) {
      // Si tenemos el mapa de tipos de hora y el ID, devolver el nombre
      const nombre = this.tipoHoraMap.get(String(tipoHoraId));
      if (nombre) {
        return nombre;
      }
    }

    // Fallback: intentar obtener el nombre directamente
    const tipoHoraNombre =
      data.tipoHoraNombre ||
      data.tipo_hora_nombre ||
      data.tipoHora ||
      data.tipo_hora;
    if (tipoHoraNombre && typeof tipoHoraNombre === 'string') {
      return tipoHoraNombre;
    }

    // Si es un objeto, intentar extraer el nombre
    if (tipoHoraNombre && typeof tipoHoraNombre === 'object') {
      if (tipoHoraNombre.nombre) return String(tipoHoraNombre.nombre);
      if (tipoHoraNombre.descripcion) return String(tipoHoraNombre.descripcion);
      if (tipoHoraNombre.name) return String(tipoHoraNombre.name);
    }

    // Último recurso: devolver el ID como string
    return tipoHoraId ? String(tipoHoraId) : '';
  }

  private processData(data: any[]): ITiempoRegistrado[] {
    return data.map((d) => this.mapToTiempoRegistrado(d));
  }

  private mapToTiempoRegistrado(d: any): ITiempoRegistrado {
    return {
      ...d,
      id: d.id ?? d.idTiempoRegistrado ?? d.id_tiempo_registrado,
      cantidadHoras: Number(d.cantidadHoras ?? d.cantidadhoras ?? 0),
      tipoHora: this.resolveTipoHora(d),
      fechaHoraInicio: this.parseDateWithTime(
        d,
        [
          'fechainicio',
          'fechaHoraInicio',
          'fecha_hora_inicio',
          'fecha_inicio',
          'fechaInicio',
        ],
        [
          'horaInicio',
          'hora_inicio',
          'horainicio',
          'hora',
          'horainicioStr',
          'horaInicioStr',
        ]
      ),
      fechaHoraFin: this.parseDateWithTime(
        d,
        ['fechafin', 'fechaHoraFin', 'fecha_hora_fin', 'fecha_fin', 'fechaFin'],
        ['horaFin', 'hora_fin', 'horafin', 'horaFinStr', 'horafinStr']
      ),
      regional: this.extractString(d, [
        'regional',
        'regionalnombre',
        'regionalNombre',
        'region',
        'regionNombre',
        'region_nombre',
      ]),
      jefe: this.extractString(d, [
        'nombreJefe',
        'nombre_jefe',
        'nombrejefe',
        'jefe',
        'jefeNombre',
        'jefeNombreCompleto',
        'responsable',
        'responsableNombre',
        'encargado',
        'supervisor',
      ]),
      nombreJefeInmediato: this.extractString(d, [
        'nombreJefe',
        'nombre_jefe',
        'nombrejefe',
        'jefe',
        'jefeNombre',
        'jefeNombreCompleto',
      ]),
      proceso: this.resolveProceso(d),
      evidencia: this.extractString(d, [
        'evidencia',
        'comoEvidencia',
        'evidencianombre',
        'evidenciaNombre',
        'evidencias',
      ]),
      estadoJefe: this.normalizeEstado(
        d.estadoJefe ?? d.estadojefe ?? d.estado_jefe
      ),
      estadoGh: this.normalizeEstado(
        d.estadoGh ??
          d.estadogh ??
          d.estado_gh
      ),
      estadoPago: this.normalizeEstado(
        d.estadoPago ??
          d.estadopago ??
          d.estado_pago ??
          d.estadoPagos ??
          d.estado_pagos
      ),
      nombreColaborador: this.extractString(d, [
        'nombreColaborador',
        'nombre_colaborador',
        'nombrecolaborador',
        'colaborador',
        'usuario',
        'nombreUsuario',
        'nombre_usuario',
      ]),
    } as ITiempoRegistrado;
  }

  private extractString(obj: any, keys: string[]): string {
    for (const key of keys) {
      const value = obj[key];
      if (value != null) {
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value);
        }
        if (typeof value === 'object') {
          return (
            value.nombre || value.descripcion || value.name || String(value)
          );
        }
      }
    }
    return '';
  }

  private parseDateWithTime(
    obj: any,
    dateKeys: string[],
    timeKeys: string[]
  ): Date | null {
    let dateOnly: Date | null = null;

    for (const key of dateKeys) {
      const value = obj[key];
      if (value) {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          if (typeof value === 'string' && /T|\s+\d{1,2}:\d{2}/.test(value)) {
            return parsed;
          }
          dateOnly = new Date(
            parsed.getFullYear(),
            parsed.getMonth(),
            parsed.getDate()
          );
          break;
        }
      }
    }

    if (!dateOnly) return null;

    for (const key of timeKeys) {
      const timeValue = obj[key];
      if (timeValue) {
        const timeStr = String(timeValue).trim();
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (timeMatch) {
          const hours = Number(timeMatch[1]);
          const minutes = Number(timeMatch[2]);
          const seconds = timeMatch[3] ? Number(timeMatch[3]) : 0;
          return new Date(
            dateOnly.getFullYear(),
            dateOnly.getMonth(),
            dateOnly.getDate(),
            hours,
            minutes,
            seconds
          );
        }
      }
    }

    return dateOnly;
  }

  private normalizeEstado(value: any): string {
    if (!value) return '';
    const str = String(value).trim().toLowerCase();
    if (str.includes('aprob')) return 'Aprobado';
    if (str.includes('rechaz')) return 'Rechazado';
    if (str.includes('pend')) return 'Pendiente';
    if (str.includes('pag') && str.includes('no')) return 'No Pagado';
    if (str.includes('pag')) return 'Pagado';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getItemId(item: any): number | null {
    if (!item) return null;
    const raw =
      item.id ?? item.idTiempoRegistrado ?? item.id_tiempo_registrado ?? null;
    if (raw == null || raw === '') return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  }

  isElementPending(element: ITiempoRegistrado): boolean {
    const estado = (element.estadoJefe || '').toString().trim().toLowerCase();
    return estado === 'pendiente' || estado.includes('pend');
  }

  private removeElementFromTable(element: ITiempoRegistrado): void {
    this.dataSource.data = this.dataSource.data.filter(
      (d) => d.id !== element.id
    );
    this.resultsLength = this.dataSource.data.length;
  }

  private showSuccessModal(title: string): void {
    this.dialog.open(SuccessModal, {
      width: '520px',
      data: { title, message: '' },
      disableClose: true,
    });
  }

  private _initDateLimits() {
    const now = new Date();
    this.maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const minMonth = now.getMonth() - 2;
    this.minDate = new Date(now.getFullYear(), minMonth, 1);
    this.startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  openPicker(which: 'inicio' | 'fin', pickerRef: any) {
    this.pickerService.current = which;
    try {
      pickerRef.open();
    } catch {}
  }

  onFechaChange() {
    this.updateFilter();
  }

  limpiarFiltros() {
    this.filterValue = '';
    this.filtroColaborador = '';
    this.filtroJefeInmediato = '';
    this.fechaInicio = null;
    this.fechaFin = null;
    this.updateFilter();
  }

  private updateFilter() {
    const filterObj: any = {
      text: (this.filterValue || '').trim().toLowerCase(),
      start: null,
      end: null,
    };

    if (this.fechaInicio instanceof Date) {
      const startDate = new Date(
        this.fechaInicio.getFullYear(),
        this.fechaInicio.getMonth(),
        this.fechaInicio.getDate()
      );
      startDate.setHours(0, 0, 0, 0);
      filterObj.start = startDate.getTime();
    }
    if (this.fechaFin instanceof Date) {
      const endDate = new Date(
        this.fechaFin.getFullYear(),
        this.fechaFin.getMonth(),
        this.fechaFin.getDate()
      );
      endDate.setHours(23, 59, 59, 999);
      filterObj.end = endDate.getTime();
    }

    this.dataSource.filterPredicate = (
      data: ITiempoRegistrado,
      filter: string
    ) => {
      let f = null;
      try {
        f = JSON.parse(filter);
      } catch {
        f = { text: (filter || '').toString().toLowerCase() };
      }

      // Filtro por texto
      const hayTexto = (f.text || '') !== '';
      if (hayTexto) {
        const haystack = `${data.tipoHora || ''} ${data.estadoJefe || ''} ${
          data.estadoGh || ''
        } ${data.estadoPago || ''} ${data.nombreColaborador || ''} ${
          data.proceso || ''
        }`.toLowerCase();
        if (!haystack.includes(f.text)) {
          return false;
        }
      }

      // Filtro por colaborador
      if (
        this.filtroColaborador &&
        data.nombreColaborador !== this.filtroColaborador
      ) {
        return false;
      }

      // Filtro por jefe inmediato
      if (
        this.filtroJefeInmediato &&
        (data as any).nombreJefeInmediato !== this.filtroJefeInmediato
      ) {
        return false;
      }

      if (f.start != null || f.end != null) {
        const time = data.fechaHoraInicio
          ? new Date(data.fechaHoraInicio).getTime()
          : null;
        if (time == null) return false;
        if (f.start != null && time < f.start) return false;
        if (f.end != null && time > f.end) return false;
      }

      return true;
    };

    this.dataSource.filter = JSON.stringify(filterObj);

    setTimeout(() => {
      this.resultsLength = this.dataSource.filteredData.length;
      try {
        this.dataSource.paginator?.firstPage();
      } catch {}
    }, 0);
  }
}
