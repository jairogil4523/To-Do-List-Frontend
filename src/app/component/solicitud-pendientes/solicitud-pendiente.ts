import {
  Component,
  OnInit,
  ViewChild,
  Injectable,
  OnDestroy,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
// ServiceRegistroHoras removed: using EstadoService exclusively
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CustomDatepickerHeader } from '../picker/custom-datepicker-header';
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
import { takeUntil } from 'rxjs/operators';
import { IEstado } from '../../model/estado/estado-model';

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
  selector: 'app-solicitud-pendiente',
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
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    CustomDatepickerHeader,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MatPaginatorIntl, useFactory: getPaginatorIntlEs },
  ],
  templateUrl: './solicitud-pendiente.html',
  styleUrls: ['./solicitud-pendiente.css'],
})
export class SolicitudPendiente implements OnInit, OnDestroy {
  CustomDatepickerHeader = CustomDatepickerHeader;
  private destroy$ = new Subject<void>();

  resultsLength = 0;
  filterValue = '';
  isLoading = false;
  fechaInicial: string | null = null;
  fechaFinal: string | null = null;
  filtroColaborador = '';
  colaboradores: string[] = [];
  colaboradoresFiltrados: string[] = [];

  displayedColumns: string[] = [
    'nombreColaborador',
    'tipoHora',
    'fechaHoraInicio',
    'fechaHoraFin',
    'proceso',
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
    this.loadColaboradores();
  }

  private loadCatalogData() {
    // Cargar tipos de hora y procesos en paralelo
    const tipoHora$ = this.tipoHoraService.getTipoHoras();
    const proceso$ = this.procesoService.getProcesos();

    // Cargar tipos de hora
    tipoHora$.subscribe({
      next: (tiposHora: any[]) => {
        this.tipoHoraMap.clear();
        tiposHora.forEach((tipo: any) => {
          const id = tipo.id || tipo.tipoHoraId;
          const nombre =
            tipo.nombre || tipo.name || tipo.descripcion || String(tipo.id);
          if (id) {
            this.tipoHoraMap.set(String(id), nombre);
          }
        });

        // marcar que la carga del catálogo finalizó (aunque venga vacío)
        this.catalogsLoaded.tipoHora = true;
        this.checkAndLoadData();
      },
      error: (err: any) => {

        this.catalogsLoaded.tipoHora = true;
        this.checkAndLoadData();
      },
    });

    // Cargar procesos
    proceso$.subscribe({
      next: (procesos: any[]) => {
        this.procesoMap.clear();
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

        // marcar que la carga del catálogo finalizó (aunque venga vacío)
        this.catalogsLoaded.proceso = true;
        this.checkAndLoadData();
      },
      error: (err: any) => {

        this.catalogsLoaded.proceso = true;
        this.checkAndLoadData();
      },
    });
  }

  private catalogsLoaded = { tipoHora: false, proceso: false };

  private checkAndLoadData() {
    // Si ambos requests de catálogo han finalizado (success o error), cargar los datos.
    if (this.catalogsLoaded.tipoHora && this.catalogsLoaded.proceso) {
      this.loadData();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(value: string) {
    this.filterValue = (value || '').trim().toLowerCase();
    this.updateFilter();
  }

  openVer(element: ITiempoRegistrado) {
    const dialogRef = this.dialog.open(VerTiempoModal, {
      width: '1100px',
      maxWidth: '95vw',
      data: { ...element, showEdit: false },
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

  openConfirmApprove(element: IEstado) {
    if (!this.isPendiente(element)) return;
    this.dialog
      .open(ConfirmModal, {
        width: '520px',
        data: {
          title: '¿Está seguro que desea APROBAR el registro?',
          message: 'El registro será aprobado después de esta acción.',
          confirmText: 'APROBAR',
          cancelText: 'CANCELAR',
        },
        disableClose: true,
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res?.confirmed) return;
          let id = this.getEstadoId(element);
          if (id == null) id = this.getItemId(element);
  if (id == null) return;
  // Enviar valor numérico y nombre de campo consistente con el servicio
  const payload = { estadojefeid: 2 };

        this.estadoService.updateEstado(id, payload).subscribe(() => {
          this.removeFromTable(element);
          this.showSuccess('Registro APROBADO correctamente');
        });
      });
  }

  openRejectModal(el: ITiempoRegistrado) {
    if (!this.isPendiente(el)) return;
    this.dialog
      .open(RejectModal, {
        width: '520px',
        data: {
          title: '¿Está seguro que desea RECHAZAR el registro?',
          placeholder: 'Mencione el motivo del rechazo',
          confirmText: 'RECHAZAR',
          cancelText: 'CANCELAR',
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
  // Usar la misma propiedad 'estadojefe' (lowercase) y número para coherencia
  const payload: any = { estadojefeid: 3,
   };
  if (res.reason) payload.motivoRechazoJefe = res.reason;

        this.estadoService.updateEstado(id, payload).subscribe(() => {
          this.removeFromTable(el);
          this.showSuccess('Registro RECHAZADO correctamente');
        });
      });
  }

  confirmAndDelete(element: ITiempoRegistrado) {
    const estado = (element.estadoJefe || '').toString().trim();
    if (estado.toLowerCase() !== 'pendiente') {

      return;
    }

    const itemId = this.getItemId(element);
    if (itemId == null) {

      return;
    }

    const ok = window.confirm(
      '¿Confirma eliminar este registro? Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    this.estadoService.deleteEstado(itemId, element).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(
          (d) => d.id !== element.id
        );
        this.resultsLength = this.dataSource.data.length;
      },
      error: (err) => {

      },
    });
  }

  private loadData() {
    this.isLoading = true;

    const handleResponse = (data: any) => {
      const parsed: ITiempoRegistrado[] = this.processData(data || []);
      const pendientes = parsed.filter((item) => {
        const estado = (item.estadoJefe || '').toString().toLowerCase().trim();
        return estado === 'pendiente' || estado.includes('pend');
      });

      pendientes.sort((a, b) => {
        const ta = a?.fechaHoraInicio
          ? new Date(a.fechaHoraInicio).getTime()
          : Number.NEGATIVE_INFINITY;
        const tb = b?.fechaHoraInicio
          ? new Date(b.fechaHoraInicio).getTime()
          : Number.NEGATIVE_INFINITY;
        return tb - ta;
      });

      this.dataSource.data = pendientes;
      this.resultsLength = this.dataSource.data.length;
      this.loadColaboradores();
      this.updateFilter();
      this.isLoading = false;
    };

    const idColaborador = this.authService.getUserId() ?? 'sevo0401';
    const rol = this.authService.getRole() ?? 'ovtjefe';

    this.estadoService.getEstados(idColaborador, rol).subscribe({
      next: (data) => handleResponse(data),
      error: () => this.isLoading = false
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
    return data.map((d: any) => {
      const pickString = (...keys: string[]) => {
        for (const k of keys) {
          const v = d[k];
          if (v == null) continue;
          if (typeof v === 'string' || typeof v === 'number') return String(v);
          if (typeof v === 'object') {
            // Casos comunes: { nombre: 'Valor' } o { id: 1, nombre: 'Valor' }
            if (
              v.nombre &&
              (typeof v.nombre === 'string' || typeof v.nombre === 'number')
            )
              return String(v.nombre);
            if (
              v.descripcion &&
              (typeof v.descripcion === 'string' ||
                typeof v.descripcion === 'number')
            )
              return String(v.descripcion);
            if (
              v.name &&
              (typeof v.name === 'string' || typeof v.name === 'number')
            )
              return String(v.name);
            // Casos anidados: { nombre: { valor: '...' } }
            if (
              v.nombre &&
              typeof v.nombre === 'object' &&
              (v.nombre.valor || v.nombre.value)
            )
              return String(v.nombre.valor ?? v.nombre.value);
            // Si es solo un objeto con propiedades, intentar JSON
            if (v.nombre)
              try {
                return String(v.nombre);
              } catch {}
            // Fallback: convertir todo el objeto a string
            try {
              return JSON.stringify(v);
            } catch {}
          }
        }
        return '';
      };

      const pickAndMergeDateWithTime = (
        dateKeys: string[],
        timeKeys: string[]
      ) => {
        let dateOnly: Date | null = null;

        for (const k of dateKeys) {
          const v = d[k];
          if (v == null) continue;

          if (typeof v === 'string') {
            const hasTime = /T|\s+\d{1,2}:\d{2}/.test(v);
            const parsed = new Date(v);
            if (!isNaN(parsed.getTime())) {
              if (hasTime) return parsed;
              const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (m) {
                const y = Number(m[1]);
                const mo = Number(m[2]) - 1;
                const day = Number(m[3]);
                const dt = new Date(y, mo, day);
                if (!isNaN(dt.getTime())) {
                  dateOnly = dt;
                  break;
                }
              }
            }
          }

          if (v instanceof Date) {
            if (
              v.getHours() !== 0 ||
              v.getMinutes() !== 0 ||
              v.getSeconds() !== 0
            )
              return v;
            dateOnly = new Date(v.getFullYear(), v.getMonth(), v.getDate());
            break;
          }

          const parsed = new Date(v);
          if (!isNaN(parsed.getTime())) {
            if (
              parsed.getHours() !== 0 ||
              parsed.getMinutes() !== 0 ||
              parsed.getSeconds() !== 0
            )
              return parsed;
            dateOnly = new Date(
              parsed.getFullYear(),
              parsed.getMonth(),
              parsed.getDate()
            );
            break;
          }
        }

        if (!dateOnly) return null;

        let timeStr: string | null = null;
        for (const tk of timeKeys) {
          const tv = d[tk];
          if (!tv) continue;
          if (typeof tv === 'string' || typeof tv === 'number') {
            timeStr = String(tv).trim();
            break;
          }
          if (typeof tv === 'object') {
            if (tv.hora) {
              timeStr = String(tv.hora);
              break;
            }
            if (tv.valor) {
              timeStr = String(tv.valor);
              break;
            }
            if (tv.value) {
              timeStr = String(tv.value);
              break;
            }
          }
        }

        if (!timeStr) return dateOnly;

        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (timeMatch) {
          const hh = Number(timeMatch[1]);
          const mm = Number(timeMatch[2]);
          const ss = timeMatch[3] ? Number(timeMatch[3]) : 0;
          return new Date(
            dateOnly.getFullYear(),
            dateOnly.getMonth(),
            dateOnly.getDate(),
            hh,
            mm,
            ss
          );
        }

        return dateOnly;
      };

      const normalizeEstado = (val: any) => {
        if (val == null) return '';
        const s = String(val).trim();
        if (!s) return '';
        const low = s.toLowerCase();
        if (low.includes('aprob')) return 'Aprobado';
        if (low.includes('rechaz')) return 'Rechazado';
        if (low.includes('pend')) return 'Pendiente';
        if (low.includes('no') && low.includes('pag')) return 'No Pagado';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      };

      return {
        ...d,
        id:
          d.id ??
          d.idTiempoRegistrado ??
          d.id_tiempo_registrado ??
          d.idTiempoRegistrado,
        cantidadHoras: Number(d.cantidadHoras ?? d.cantidadhoras ?? 0),
        tipoHora: this.resolveTipoHora(d),
        fechaHoraInicio: pickAndMergeDateWithTime(
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
        fechaHoraFin: pickAndMergeDateWithTime(
          [
            'fechafin',
            'fechaHoraFin',
            'fecha_hora_fin',
            'fecha_fin',
            'fechaFin',
          ],
          ['horaFin', 'hora_fin', 'horafin', 'horaFinStr', 'horafinStr']
        ),
        regional: pickString(
          'regional',
          'regionalnombre',
          'regionalNombre',
          'region',
          'regionNombre',
          'region_nombre'
        ),
        jefe: pickString(
          'nombreJefe',
          'nombre_jefe',
          'nombrejefe',
          'jefe',
          'jefeNombre',
          'jefeNombreCompleto',
          'responsable',
          'responsableNombre',
          'encargado',
          'supervisor'
        ),
        proceso: this.resolveProceso(d),
        evidencia: pickString(
          'evidencia',
          'comoEvidencia',
          'evidencianombre',
          'evidenciaNombre',
          'evidencias'
        ),
        estadoJefe: normalizeEstado(
          d.estadoJefe ?? d.estadojefe ?? d.estado_jefe
        ),
        estadoGh: normalizeEstado(d.estadoGh ?? d.estadogh ?? d.estado_gh),
        estadoPago: normalizeEstado(
          d.estadoPago ?? d.estadopago ?? d.estado_pago
        ),
        nombreColaborador: pickString(
          'nombreColaborador',
          'nombre_colaborador',
          'nombrecolaborador',
          'colaborador',
          'usuario',
          'nombreUsuario',
          'nombre_usuario'
        ),
      } as ITiempoRegistrado;
    });
  }

  // Helper para obtener el identificador numérico de un registro (soporta varios nombres)
  private getItemId(item: any): number | null {
    if (!item) return null;
    const raw =
      item.id ??
      item.idTiempoRegistrado ??
      item.id_tiempo_registrado ??
      item.idTiempoRegistrado ??
      null;
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }

  // Helper para obtener el identificador del ESTADO (idEstado) que puede venir
  // en distintas formas según la respuesta: idEstado, estadoid, estadoId, id_estado, etc.
  // Si no se encuentra, devuelve null (el caller puede usar getItemId como fallback).
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

  private updateFilter() {
    const filterObj: any = {
      text: (this.filterValue || '').trim().toLowerCase(),
      colaborador: (this.filtroColaborador || '').trim(),
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

      const hayColaborador = (f.colaborador || '') !== '';
      if (hayColaborador && !(data.nombreColaborador || '').toLowerCase().includes(f.colaborador.toLowerCase())) {
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

  isPendiente(el: IEstado | ITiempoRegistrado | any): boolean {
    // Soportar tanto ITiempoRegistrado como IEstado u objetos genéricos que contengan estado/estadoJefe
    const raw = (el && (el.estadoJefe ?? el.estado)) ?? '';
    const estado = String(raw).toLowerCase();
    return estado.includes('pend');
  }

  private removeFromTable(el: IEstado | ITiempoRegistrado) {
    // only the id is required to remove the item from the table;
    // accept IEstado or ITiempoRegistrado to avoid type errors when callers pass either type.
    const idToRemove = (el as any)?.id ?? null;
    if (idToRemove == null) return;
    this.dataSource.data = this.dataSource.data.filter(
      (d) => d.id !== idToRemove
    );
    this.resultsLength = this.dataSource.data.length;
  }

  private showSuccess(title: string) {
    this.dialog.open(SuccessModal, {
      width: '520px',
      data: { title, message: '' },
      disableClose: true,
    });
  }

  onFilterChange() {
    const filterValue = this.filtroColaborador.toLowerCase();
    this.colaboradoresFiltrados = this.colaboradores.filter(colaborador => 
      colaborador.toLowerCase().includes(filterValue)
    );
    this.updateFilter();
  }

  private loadColaboradores() {
    // Extract unique collaborators from current data
    const uniqueColaboradores = [...new Set(this.dataSource.data.map(item => item.nombreColaborador).filter(Boolean))] as string[];
    this.colaboradores = uniqueColaboradores;
    this.colaboradoresFiltrados = uniqueColaboradores;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
