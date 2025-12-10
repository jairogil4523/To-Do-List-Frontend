import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  DateAdapter,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { TipoHoraService } from '../../service/tipoHora/tipo-hora.service';
import { ProcesoService } from '../../service/proceso/proceso.service';
import { EstadoService } from '../../service/estado/estado.service';
import { UsuarioService } from '../../service/usuarios/usuario.service';
import { ITiempoRegistrado } from '../../model/tiempoRegistrado/tiempo-registrado.model';
import { CustomDatepickerHeader } from '../picker/custom-datepicker-header';
import { getPaginatorIntlEs } from '../../shared/mat-paginator-intl-es';
import { VerTiempoModal } from '../shared/ver-tiempo-modal/ver-tiempo-modal';
import { EditarTiempoModal } from '../shared/editar-tiempo-modal/editar-tiempo-modal';
import { ConfirmModal } from '../shared/confirm-modal/confirm-modal';
import { SuccessModal } from '../shared/success-modal/success-modal';
import { RejectModal } from '../shared/reject-modal/reject-modal';


import { NativeDateAdapter } from '@angular/material/core';
class AppDateAdapter extends NativeDateAdapter {
  override format(date: Date): string {
    if (!date) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(
      date.getMonth() + 1
    )}/${date.getFullYear()}`;
  }

  override parse(value: any): Date | null {
    if (!value) return null;
    if (typeof value !== 'string') return super.parse(value);
    const [day, month, year] = value.split('/').map(Number);
    return day && month && year
      ? new Date(year, month - 1, day)
      : super.parse(value);
  }
}

/* --------------  Componente  -------------- */
@Component({
  selector: 'app-solicitud-pendiente-gh',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    CustomDatepickerHeader,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MatPaginatorIntl, useFactory: getPaginatorIntlEs },
  ],
  templateUrl: './devolver-solicitudes-nacional.html',
  styleUrls: ['./devolver-solicitudes-nacional.css'],
})
export class DevolverSolicitudesNacional implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  /* ---- UI ---- */
  isLoading = false;
  resultsLength = 0;
  filterValue = '';
  displayedColumns: string[] = [
    'nombreColaborador',
    'nombreJefeInmediato',
    'tipoHora',
    'fechaHoraInicio',
    'fechaHoraFin',
    'estadoJefe',
    'estadoGh',
    'estadoPago',
    'acciones',
  ];

  /* ---- Filtros ---- */
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  filtroRegional = '';
  filtroColaborador = '';
  filtroJefeInmediato = '';
  regionales: string[] = [];
  colaboradores: string[] = [];
  jefesInmediatos: string[] = [];

  /* ---- Tabla ---- */
  dataSource = new MatTableDataSource<ITiempoRegistrado>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /* ---- Catálogos ---- */
  private tipoHoraMap = new Map<string, string>();
  private procesoMap = new Map<string, string>();
  private regionalMap = new Map<string, string>();

  /* ---- Fechas picker ---- */
  minDate!: Date;
  maxDate!: Date;
  startAt!: Date;
  CustomDatepickerHeader = CustomDatepickerHeader;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private usuarioService: UsuarioService,
    private tipoHoraService: TipoHoraService,
    private procesoService: ProcesoService,
    private estadoService: EstadoService
  ) {}

  ngOnInit(): void {
    this.initDateLimits();
    this.loadCatalogsAndData();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* --------------  Privados  -------------- */
  private initDateLimits() {
    const now = new Date();
    this.maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.minDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    this.startAt = new Date(now);
  }

  private loadCatalogsAndData() {
    const tipos$ = this.tipoHoraService
      .getTipoHoras()
      .pipe(catchError(() => of([])));
    const procesos$ = this.procesoService
      .getProcesos()
      .pipe(catchError(() => of([])));

    this.initRegionalMap();

    forkJoin({ tipos: tipos$, procesos: procesos$ })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ tipos, procesos }) => {
        this.buildMaps(tipos, procesos);
        this.loadData();
      });
  }

  private buildMaps(tipos: any[], procesos: any[]) {
    const fill = (list: any[], map: Map<string, string>, label = 'nombre') =>
      list.forEach((i) =>
        map.set(
          String(i.id ?? i.tipoHoraId ?? i.procesoId),
          i[label] ?? i.name ?? i.descripcion ?? String(i.id)
        )
      );

    fill(tipos, this.tipoHoraMap);
    fill(procesos, this.procesoMap);
  }



  private loadData() {
    this.isLoading = true;
    const { id, rol } = this.getUserCredentials();
    this.estadoService
      .getEstados(id, rol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (raw) => this.handleData(raw),
        error: () => (this.isLoading = false),
      });
  }

  private getUserCredentials() {
    const keys = (k: string[]) =>
      k.map((k) => localStorage.getItem(k)).find((v) => v);
    const userRaw = keys(['usuarioRes', 'usuario', 'user']);
    const rol = keys(['rol', 'role']);
    let id = userRaw;
    try {
      const parsed = JSON.parse(userRaw!);
      id =
        parsed.id ??
        parsed.usuarioId ??
        parsed.idColaborador ??
        parsed.identificacion;
    } catch {}
    
    // Convertir rol de jefe a GH para este componente
    let ghRol = rol ?? 'ovtghmp';
    if (ghRol === 'ovtjefemp') ghRol = 'ovtghmp';
    if (ghRol === 'ovtjefecm') ghRol = 'ovtghcm';
    
    return { id: id ?? 'sevo0401', rol: ghRol };
  }

  private handleData(raw: any[]) {
    const parsed = (raw || []).map((i) => this.mapToTiempoRegistrado(i));
    const sorted = parsed.sort(
      (a, b) => +new Date(b.fechaHoraInicio) - +new Date(a.fechaHoraInicio)
    );
    this.dataSource.data = sorted;
    this.resultsLength = sorted.length;
    this.updateFilterLists(sorted);
    this.updateFilter();
    this.isLoading = false;
  }

  private updateFilterLists(data: ITiempoRegistrado[]) {
    this.regionales = [
      ...new Set(
        data
          .map((i) => (i as any).regional)
          .filter((name): name is string => !!name)
      ),
    ].sort();
    this.colaboradores = [
      ...new Set(
        data
          .map((i) => i.nombreColaborador)
          .filter((name): name is string => !!name)
      ),
    ].sort();
    this.jefesInmediatos = [
      ...new Set(
        data
          .map((i) => (i as any).nombreJefeInmediato)
          .filter((name): name is string => !!name)
      ),
    ].sort();
  }

  /* --------------  Mapeo  -------------- */
  private mapToTiempoRegistrado(d: any): ITiempoRegistrado {
    return {
      ...d,
      id: d.id ?? d.idTiempoRegistrado,
      cantidadHoras: Number(d.cantidadHoras ?? 0),
      tipoHora: this.resolveTipoHora(d),
      proceso: this.resolveProceso(d),
      fechaHoraInicio: this.parseDateTime(d, 'fechaHoraInicio', 'horaInicio'),
      fechaHoraFin: this.parseDateTime(d, 'fechaHoraFin', 'horaFin'),
      estadoJefe: this.normalizeEstado(d.estadoJefe),
      estadoGh: this.normalizeEstado(d.estadoGh || d.estadoGH || d.estado_gh),
      estadoPago: this.normalizeEstado(d.estadoPago || d.estadoPago || d.estado_pago),
      nombreColaborador:
        d.nombreColaborador || d.colaborador || d.usuario || '',
      nombreJefeInmediato: d.nombreJefe || '',
      regional: d.regionalNombre || d.nombreRegional || 'Sin Regional'
    } as ITiempoRegistrado;
  }

  private resolveTipoHora(d: any): string {
    const id = d.tipoHoraId || d.tipoHora;
    return id
      ? this.tipoHoraMap.get(String(id)) ?? d.tipoHoraNombre ?? String(id)
      : '';
  }

  private resolveProceso(d: any): string {
    const id = d.procesoId || d.proceso;
    return id
      ? this.procesoMap.get(String(id)) ?? d.procesoNombre ?? String(id)
      : '';
  }

  private initRegionalMap() {
    this.regionalMap.set('1', 'Regional Bogotá');
    this.regionalMap.set('2', 'Regional Medellín');
    this.regionalMap.set('3', 'Regional Cali');
    this.regionalMap.set('4', 'Regional Barranquilla');
    this.regionalMap.set('5', 'Regional Bucaramanga');
    this.regionalMap.set('6', 'Regional Pereira');
    this.regionalMap.set('7', 'Regional Manizales');
    this.regionalMap.set('8', 'Regional Cartagena');
  }

  private parseDateTime(obj: any, dateKey: string, timeKey: string): Date | null {
    const dateCandidates = [
      dateKey,
      dateKey.toLowerCase(),
      'fechaInicio',
      'fechainicio',
      'fecha_inicio',
      'fechaHoraInicio',
      'fecha_hora_inicio',
      'fechaFin',
      'fechafin',
      'fecha_fin',
    ];

    const timeCandidates = [
      timeKey,
      timeKey.toLowerCase(),
      'horaInicio',
      'horainicio',
      'hora_inicio',
      'hora',
      'horafin',
      'horaFin',
      'hora_fin',
      'horainicioStr',
      'horaInicioStr',
    ];

    const getFirst = (keys: string[]) => {
      for (const k of keys) {
        if (k == null) continue;
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null)
          return obj[k];
        const alt = Object.keys(obj).find((o) => o.toLowerCase() === k.toLowerCase());
        if (alt && obj[alt] != null) return obj[alt];
      }
      return null;
    };

    const dateVal = getFirst(dateCandidates);
    const timeVal = getFirst(timeCandidates);

    if (!dateVal) return null;
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return null;
    if (!timeVal || typeof timeVal !== 'string') return date;
    const [, h, m, s] = timeVal.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) || [];
    if (h != null) date.setHours(+h, +m, +(s || 0));
    return date;
  }

  private normalizeEstado(v?: any): string {
    const str = String(v || '').toLowerCase();
    if (str.includes('aprob')) return 'Aprobado';
    if (str.includes('rechaz')) return 'Rechazado';
    if (str.includes('pend')) return 'Pendiente';
    if (str.includes('pag') && str.includes('no')) return 'No Pagado';
    if (str.includes('pag')) return 'Pagado';
    // Si no hay valor o está vacío, devolver 'Pendiente' por defecto para GH
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : 'Pendiente';
  }

  /* --------------  Filtros  -------------- */
  applyFilter(value: string) {
    this.filterValue = (value || '').trim().toLowerCase();
    this.updateFilter();
  }

  onFilterChange() {
    this.updateFilter();
  }

  onFechaChange() {
    this.updateFilter();
  }

  limpiarFiltros() {
    this.fechaInicio = null;
    this.fechaFin = null;
    this.filtroRegional = '';
    this.filtroColaborador = '';
    this.filtroJefeInmediato = '';
    this.estadoJefeFilter = '';
    this.estadoGhFilter = '';
    this.estadoPagoFilter = '';
    this.filterValue = '';
    this.updateFilter();
  }

  private updateFilter() {
    const filterObj = {
      text: this.filterValue,
      start: this.fechaInicio
        ? new Date(this.fechaInicio).setHours(0, 0, 0, 0)
        : null,
      end: this.fechaFin
        ? new Date(this.fechaFin).setHours(23, 59, 59, 999)
        : null,
    };

    this.dataSource.filterPredicate = (
      data: ITiempoRegistrado,
      filter: string
    ) => {
      const f = JSON.parse(filter);
      const haystack =
        `${data.tipoHora} ${data.estadoJefe} ${data.estadoGh} ${data.estadoPago} ${data.nombreColaborador} ${data.proceso}`.toLowerCase();
      if (f.text && !haystack.includes(f.text)) return false;
      if (
        this.filtroRegional &&
        (data as any).regional !== this.filtroRegional
      )
        return false;
      if (
        this.filtroColaborador &&
        data.nombreColaborador !== this.filtroColaborador
      )
        return false;
      if (
        this.filtroJefeInmediato &&
        (data as any).nombreJefeInmediato !== this.filtroJefeInmediato
      )
        return false;

      // Status filters
      if (this.estadoJefeFilter && data.estadoJefe !== this.estadoJefeFilter)
        return false;
      if (this.estadoGhFilter && data.estadoGh !== this.estadoGhFilter)
        return false;
      if (this.estadoPagoFilter && data.estadoPago !== this.estadoPagoFilter)
        return false;

      const time = data.fechaHoraInicio ? +new Date(data.fechaHoraInicio) : 0;
      if (f.start && time < f.start) return false;
      if (f.end && time > f.end) return false;
      return true;
    };

    this.dataSource.filter = JSON.stringify(filterObj);
    this.resultsLength = this.dataSource.filteredData.length;
    setTimeout(() => this.dataSource.paginator?.firstPage(), 0);
  }

  /* --------------  Acciones  -------------- */
  openVer(el: ITiempoRegistrado) {
    this.dialog.open(VerTiempoModal, {
      width: '1100px',
      maxWidth: '95vw',
      data: { ...el, showEdit: false },
      disableClose: true,
    });
  }

  openEditar(el: ITiempoRegistrado) {
    this.dialog.open(EditarTiempoModal, {
      width: '1100px',
      maxWidth: '95vw',
      data: { ...el, showEdit: true },
      disableClose: true,
    });
  }

  openConfirmApprove(el: ITiempoRegistrado) {
    // Bloquear la acción si el estado jefe está en 'Pendiente'
    if (this.isPendiente(el)) return;
    this.dialog
      .open(ConfirmModal, {
        width: '520px',
        data: {
          title: '¿Está seguro que desea Devolver el registro?',
          message: 'El registro será devuelto después de esta acción.',
          confirmText: 'Devolver',
        },
        disableClose: true,
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res?.confirmed) return;
          let id = this.getEstadoId(el);
          if (id == null) id = this.getItemId(el);
  if (id == null) return;
        this.estadoService
          .updateEstado(id, { estadojefeid: '1' })
          .subscribe(() => {
            this.removeFromTable(el);
            this.showSuccess('Registro DEVUELTO correctamente');
            this.loadData();
          });
      });
  }
  //devolver gh
  openConfirmApprove1(el: ITiempoRegistrado) {
    // Bloquear la acción si el estado GH está en 'Pendiente'
    if (this.isPendienteGh(el)) return;
    this.dialog
      .open(ConfirmModal, {
        width: '520px',
        data: {
          title: '¿Está seguro que desea Devolver el registro?',
          message: 'El registro será devuelto después de esta acción.',
          confirmText: 'Devolver',
        },
        disableClose: true,
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res?.confirmed) return;
          let id = this.getEstadoId(el);
          if (id == null) id = this.getItemId(el);
  if (id == null) return;
        this.estadoService
          .updateEstado(id, { estadoghid: '1' })
          .subscribe(() => {
            this.removeFromTable(el);
            this.showSuccess('Registro DEVUELTO correctamente');
            this.loadData();
          });
      });
  }

  //devolver pago
  openConfirmApprove2(el: ITiempoRegistrado) {
    // Bloquear la acción si el estado GH está en 'Pendiente'
    if (this.isPendientePago(el)) return;
    this.dialog
      .open(ConfirmModal, {
        width: '520px',
        data: {
          title: '¿Está seguro que desea Devolver el registro?',
          message: 'El registro será devuelto después de esta acción.',
          confirmText: 'Devolver',
        },
        disableClose: true,
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res?.confirmed) return;
          let id = this.getEstadoId(el);
          if (id == null) id = this.getItemId(el);
  if (id == null) return;
        this.estadoService
          .updateEstado(id, { estadopagoid: '1' })
          .subscribe(() => {
            this.removeFromTable(el);
            this.showSuccess('Registro DEVUELTO correctamente');
            this.loadData();
          });
      });
  }

  confirmAndDelete(el: ITiempoRegistrado) {
    if (
      !this.isPendiente(el) ||
      !confirm(
        '¿Confirma eliminar este registro? Esta acción no se puede deshacer.'
      )
    )
      return;
    const id = this.getItemId(el);
    if (id == null) return;
    this.estadoService
      .deleteEstado(id, el)
      .subscribe(() => this.removeFromTable(el));
  }

  /* --------------  Helpers  -------------- */
  isPendiente(el: ITiempoRegistrado) {
    return (el.estadoJefe || '').toLowerCase().includes('pend');
  }

  /**
   * Determina si el estado GH está en 'Pendiente'.
   * Retorna true si contiene 'pend' (case-insensitive).
   */
  isPendienteGh(el: ITiempoRegistrado) {
    return (el.estadoGh || '').toLowerCase().includes('pend');
  }

  /**
   * Determina si el estado de pago está en 'Pendiente'.
   * Retorna true si contiene 'pend' (case-insensitive).
   */
  isPendientePago(el: ITiempoRegistrado) {
    return (el.estadoPago || '').toLowerCase().includes('pend');
  }

  private getItemId(el: any): number | null {
    const raw = el.id ?? el.idTiempoRegistrado;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  }

  private removeFromTable(el: ITiempoRegistrado) {
    this.dataSource.data = this.dataSource.data.filter((d) => d.id !== el.id);
    this.resultsLength = this.dataSource.data.length;
  }

  private showSuccess(title: string) {
    this.dialog.open(SuccessModal, {
      width: '520px',
      data: { title, message: '' },
      disableClose: true,
    });
  }

  /* ----------  Auxiliares para el template  ---------- */
  columnDefs = [
    { def: 'nombreColaborador', header: 'Nombre Colaborador' },
    { def: 'nombreJefeInmediato', header: 'Nombre Jefe Inmediato' },
    { def: 'tipoHora', header: 'Tipo de Hora' },
    {
      def: 'fechaHoraInicio',
      header: 'Fecha Inicio',
      pipe: 'dd/MM/yyyy hh:mm a',
    },
    { def: 'fechaHoraFin', header: 'Fecha Fin', pipe: 'dd/MM/yyyy hh:mm a' },
    { def: 'estadoJefe', header: 'Estado Jefe', badge: true },
    { def: 'estadoGh', header: 'Estado GH', badge: true },
    { def: 'estadoPago', header: 'Estado Pago', badge: true },
  ];

  // expuestos para [(ngModel)]
  estadoJefeFilter = '';
  estadoGhFilter = '';
  estadoPagoFilter = '';

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }


  private getEstadoId(item: any): number | null {
    if (!item) return null;
    const raw =
      item.idEstado ??
      item.idestado ??
      item.estadoid ??
      item.estadoId ??
      item.id_estado ??
      item.estado_id ??
      null;
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }

  openPicker(type: string, picker: any) {
    picker.open();
  }
}
