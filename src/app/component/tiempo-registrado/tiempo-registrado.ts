import { Component, OnInit, ViewChild, Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiceRegistroHoras } from '../../service/service-registro_horas/service-registro-horas.service';
import { TipoHoraService } from '../../service/tipoHora/tipo-hora.service';
import { EstadoService } from '../../service/estado/estado.service';
import { AuthService } from '../../service/auth/auth.service';
import { take } from 'rxjs/operators';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
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
import { CustomDatepickerHeader } from '../picker/custom-datepicker-header';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VerTiempoModal } from '../shared/ver-tiempo-modal/ver-tiempo-modal';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getPaginatorIntlEs } from '../../shared/mat-paginator-intl-es';
import { EditarTiempoModal } from '../shared/editar-tiempo-modal/editar-tiempo-modal';
import { ConfirmModal } from '../shared/confirm-modal/confirm-modal';
import { SuccessModal } from '../shared/success-modal/success-modal';
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
const ELEMENT_DATA_ESTADOS: IEstado[] = [];

@Component({
  selector: 'app-tiempo-registrado',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CustomDatepickerHeader,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MatPaginatorIntl, useFactory: getPaginatorIntlEs },
  ],
  templateUrl: './tiempo-registrado.html',
  styleUrls: ['./tiempo-registrado.css'],
})
export class TiempoRegistrado implements OnInit {
  CustomDatepickerHeader = CustomDatepickerHeader;

  resultsLength = ELEMENT_DATA.length;
  filterValue = '';
  isLoading = false;
  fechaInicial: string | null = null;
  fechaFinal: string | null = null;
  displayedColumns: string[] = [
    'cantidadHoras',
    'tipoHora',
    'fechaHoraInicio',
    'fechaHoraFin',
    'estadoJefe',
    'estadoGh',
    'estadoPago',
    'acciones',
  ];
  dataSource = new MatTableDataSource<ITiempoRegistrado>(ELEMENT_DATA);
  dataEstados = new MatTableDataSource<IEstado>(ELEMENT_DATA_ESTADOS);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  pickerService: any = { current: null };
  private _assignAttempts = 0;
  private readonly _assignMaxAttempts = 10;

  // Mapa id -> nombre para tipos de hora
  tipoHoraMap: Map<string, string> = new Map();

  constructor(
    private service: ServiceRegistroHoras,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private tipoHoraService: TipoHoraService
    ,
    private estadoService: EstadoService,
    private authService: AuthService
  ) {}

  // usuario/rol detectado desde AuthService
  currentUser: any = null;
  currentRole: string | null = null;
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // Asegurar que si la tabla se renderiza condicionalmente (ngIf) volvamos
    // a asignar sort/paginator cuando estén disponibles.
    this.assignTableControls();

    // Custom sorting accessor: handle dates, numeric and nested/derived fields
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      try {
        const val = item[property];
        // fechas: usar timestamp
        if (property === 'fechaHoraInicio' || property === 'fechaHoraFin') {
          const d = val ? new Date(val) : null;
          return d && !isNaN(d.getTime()) ? d.getTime() : -Infinity;
        }
        // cantidadHoras: puede ser número o derivado
        if (property === 'cantidadHoras') {
          if (typeof val === 'number') return val;
          if (item._totalMinutes != null) return Number(item._totalMinutes);
          const n = Number(val);
          return isNaN(n) ? -Infinity : n;
        }
        // estados y tipoHora: ordenar por string (insensible a mayúsculas)
        const asStr = val == null ? '' : String(val).toLowerCase();
        return asStr;
      } catch (e) {
        return '';
      }
    };
  }

  applyFilter(value: string) {
    this.filterValue = (value || '').trim().toLowerCase();
    this.updateFilter();
  }

  openVer(element: ITiempoRegistrado) {
    // Encontrar el registro completo en dataEstados para obtener todos los datos
    const estadoCompleto = this.dataEstados.data.find((e: any) => 
      (e.tiempoRegistradoid || e.estadoid) === element.id
    );
    
    // Combinar datos del elemento con datos completos del estado
    const datosCompletos = {
      ...estadoCompleto,
      ...element,
      // Mapear campos con todos los posibles nombres de propiedades
      documento: estadoCompleto?.documento || estadoCompleto?.identificacion || element.documento || '',
      identificacion: estadoCompleto?.documento || estadoCompleto?.identificacion || element.documento || '',
      cedula: estadoCompleto?.documento || estadoCompleto?.identificacion || element.documento || '',
      nombreColaborador: estadoCompleto?.nombreColaborador || element.nombreColaborador || '',
      regionalNombre: estadoCompleto?.regional || estadoCompleto?.regionalnombre || estadoCompleto?.regionalNombre || '',
      regional: estadoCompleto?.regional || estadoCompleto?.regionalnombre || estadoCompleto?.regionalNombre || '',
      regionalnombre: estadoCompleto?.regional || estadoCompleto?.regionalnombre || estadoCompleto?.regionalNombre || '',
      nombreJefe: estadoCompleto?.jefe || estadoCompleto?.jefeNombre || estadoCompleto?.nombrejefe || '',
      jefe: estadoCompleto?.jefe || estadoCompleto?.jefeNombre || estadoCompleto?.nombrejefe || '',
      jefeNombre: estadoCompleto?.jefe || estadoCompleto?.jefeNombre || estadoCompleto?.nombrejefe || '',
      nombrejefe: estadoCompleto?.jefe || estadoCompleto?.jefeNombre || estadoCompleto?.nombrejefe || '',
      tipoHora: this.tipoHoraMap.get(String(estadoCompleto?.tipoHoraId || estadoCompleto?.tipohoraid || '')) || estadoCompleto?.tipoHora || element.tipoHora || '',
      proceso: estadoCompleto?.proceso || estadoCompleto?.procesonombre || estadoCompleto?.procesoNombre || '',
      procesonombre: estadoCompleto?.proceso || estadoCompleto?.procesonombre || estadoCompleto?.procesoNombre || '',
      procesoNombre: estadoCompleto?.proceso || estadoCompleto?.procesonombre || estadoCompleto?.procesoNombre || '',
      justificacion: estadoCompleto?.justificacion || estadoCompleto?.descripcion || estadoCompleto?.observacion || '',
      descripcion: estadoCompleto?.justificacion || estadoCompleto?.descripcion || estadoCompleto?.observacion || '',
      observacion: estadoCompleto?.justificacion || estadoCompleto?.descripcion || estadoCompleto?.observacion || '',
      evidencia: estadoCompleto?.evidencia || estadoCompleto?.gestion || estadoCompleto?.comoEvidencia || '',
      gestion: estadoCompleto?.evidencia || estadoCompleto?.gestion || estadoCompleto?.comoEvidencia || '',
      comoEvidencia: estadoCompleto?.evidencia || estadoCompleto?.gestion || estadoCompleto?.comoEvidencia || '',
      entregable: estadoCompleto?.entregable || estadoCompleto?.entregablePresentado || '',
      entregablePresentado: estadoCompleto?.entregable || estadoCompleto?.entregablePresentado || '',
      usuarioAplicativo: estadoCompleto?.usuarioAplicativo || estadoCompleto?.usuarioaplicativo || '',
      usuarioaplicativo: estadoCompleto?.usuarioAplicativo || estadoCompleto?.usuarioaplicativo || '',
      motivoRechazoJefe: estadoCompleto?.motivoRechazoJefe || element.motivoRechazoJefe || '',
      motivoRechazoGh: estadoCompleto?.motivoRechazoGh || element.motivoRechazoGh || '',
      // IDs para referencia
      regionalId: estadoCompleto?.regionalid || estadoCompleto?.regionalId,
      regionalid: estadoCompleto?.regionalid || estadoCompleto?.regionalId,
      jefeId: estadoCompleto?.jefeid || estadoCompleto?.jefeId,
      jefeid: estadoCompleto?.jefeid || estadoCompleto?.jefeId,
      procesoId: estadoCompleto?.procesoid || estadoCompleto?.procesoId,
      procesoid: estadoCompleto?.procesoid || estadoCompleto?.procesoId,
      gestionId: estadoCompleto?.gestionid || estadoCompleto?.gestionId || estadoCompleto?.evidenciaId,
      gestionid: estadoCompleto?.gestionid || estadoCompleto?.gestionId || estadoCompleto?.evidenciaId,
      evidenciaId: estadoCompleto?.gestionid || estadoCompleto?.gestionId || estadoCompleto?.evidenciaId,
      tipoHoraId: estadoCompleto?.tipoHoraId || estadoCompleto?.tipohoraid,
      tipohoraid: estadoCompleto?.tipoHoraId || estadoCompleto?.tipohoraid,
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
        // TODO: navegar al formulario de edición o abrir editor
      }
    });
  }

  openEditar(element: ITiempoRegistrado) {
    const dialogRef = this.dialog.open(EditarTiempoModal, {
      width: '1100px',
      maxWidth: '95vw',
      // pasar el elemento y una señal para que el modal muestre el botón editar
      data: { ...element, showEdit: true },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.action === 'edit') {
        // manejar la edición (navegar o abrir formulario)
      }
    });
  }

  confirmAndDelete(element: ITiempoRegistrado) {
    // Bloquear eliminación si el estado del jefe no es Pendiente
    const estado = (element.estadoJefe || '').toString().trim();
    if (estado.toLowerCase() !== 'pendiente') {
      // Mostrar feedback en consola; en una mejora futura se puede usar un Toast/Modal

      return;
    }

    if (!element.id) {

      return;
    }

    // Usar un modal de confirmación para coincidir con el diseño
    const dialogRef = this.dialog.open(ConfirmModal, {
      width: '520px',
      maxWidth: '95vw',
      data: {
        title: '¿Esta seguro que desea eliminar el registro?',
        message: 'El registro se eliminará de forma permanente.',
        confirmText: 'ELIMINAR',
        cancelText: 'CANCELAR',
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (!res || !res.confirmed) return;
      this.service.delete(Number(element.id), element).subscribe({
        next: () => {
          // Remover elemento del dataSource
          this.dataSource.data = this.dataSource.data.filter(
            (d) => d.id !== element.id
          );
          this.resultsLength = this.dataSource.data.length;
          // mostrar modal de éxito (imagen 2)
          this.dialog.open(SuccessModal, {
            width: '520px',
            maxWidth: '95vw',
            data: {
              title: 'Registro eliminado correctamente',
              message: '',
              logoSrc: 'assets/logoOvertimeWhite.png',
            },
            disableClose: true,
          });
        },
        error: (err) => {

          // en caso de error podríamos mostrar un modal de error, pero por ahora lo registramos
        },
      });
    });
  }

  ngOnInit(): void {
    this._initDateLimits();
    // obtener usuario/rol actual (una sola vez)
    try {
      this.authService.user$.pipe(take(1)).subscribe((payload: any) => {
        this.currentUser = payload?.user || payload?.usuario || payload;
        this.currentRole = this.authService.getRole();
      });
    } catch (e) {}
    // Cargar tipos de hora antes de cargar los registros para poder mapear ids a nombres
    this.tipoHoraService.getTipoHoras().subscribe({
      next: (list) => {
        try {
          (list || []).forEach((t) => {
            if (t == null) return;
            if (t.id != null) this.tipoHoraMap.set(String(t.id), t.nombre);
            // por si acaso el backend devuelve solo nombres
            if (t.nombre && t.id == null)
              this.tipoHoraMap.set(String(t.nombre), t.nombre);
          });
        } catch (e) {
          /* ignore mapping errors */
        }
        this.loadData();
      },
      error: (err) => {

        // aunque falle, intentar cargar los registros (se mostrará el id si no hay nombres)
        this.loadData();
      },
    });
  }
  // Cargar datos desde el endpoint de estados/tiemporegistrado por colaborador/rol
  private loadData() {
    this.isLoading = true;

    const { idColaborador, rol } = this._readUsuarioAndRolFromLocalStorage();

    // Si no se obtuvo, intentar usar user$ como fallback
    let idCol = idColaborador;
    let role = rol || this.currentRole || '';

    if (!idCol) {
      if (this.currentUser) {
        if (typeof this.currentUser === 'string') idCol = this.currentUser;
        else idCol = this.currentUser.usuario || this.currentUser.username || this.currentUser.idColaborador || this.currentUser.id || null;
      }
    }

    // Llamar al servicio EstadoService que expone el endpoint
    this.estadoService.getEstados(idCol ?? '', role ?? '').subscribe({
      next: (data) => {
        try {
          const rawList: IEstado[] = Array.isArray(data) ? data : (data?.data || []);

          // Guardar la lista de estados cruda para posibles vistas/debug
          this.dataEstados.data = rawList as any;

          // Mapear cada IEstado -> ITiempoRegistrado para poblar la tabla
          const parsed: ITiempoRegistrado[] = (rawList || []).map((e: IEstado) => this.mapEstadoToTiempo(e));

          // ordenar por fecha inicio descendente
          parsed.sort((a, b) => {
            const ta = a && a.fechaHoraInicio ? new Date(a.fechaHoraInicio).getTime() : Number.NEGATIVE_INFINITY;
            const tb = b && b.fechaHoraInicio ? new Date(b.fechaHoraInicio).getTime() : Number.NEGATIVE_INFINITY;
            return tb - ta;
          });

          this.dataSource.data = parsed;
          this.resultsLength = parsed.length;
          this.updateFilter();
          this.assignTableControls();
        } catch (err) {

          this.dataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (err) => {

        this.isLoading = false;
      },
    });
  }

  // Leer identificador de colaborador y rol desde localStorage con varios fallbacks
  private _readUsuarioAndRolFromLocalStorage(): { idColaborador: string | number | null; rol: string | null } {
    try {
      const userKeys = ['usuarioRes', 'usuario', 'user', 'usuarioResString', 'auth'];
      const rolKeys = ['rol', 'role', 'userRole', 'userRol'];

      let id: string | number | null = null;
      let rol: string | null = null;

      for (const key of userKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const obj = JSON.parse(raw);
          id = obj.id ?? obj.usuarioId ?? obj.idColaborador ?? obj.identificacion ?? obj.usuario ?? obj.user ?? null;
        } catch {
          id = raw;
        }
        if (id) break;
      }

      for (const key of rolKeys) {
        const r = localStorage.getItem(key);
        if (r) {
          rol = r;
          break;
        }
      }

      // Si en 'auth' hay un objeto con rol, intentar extraerlo
      if (!rol) {
        const authRaw = localStorage.getItem('auth');
        if (authRaw) {
          try {
            const a = JSON.parse(authRaw);
            rol = a?.rol ?? a?.role ?? null;
            if (!id) {
              const u = a?.user || a?.usuario || a;
              if (u) id = u.id ?? u.usuarioId ?? u.idColaborador ?? u.usuario ?? id;
            }
          } catch {}
        }
      }

      // Normalize role: role may be stored as JSON array or comma-separated string
      try {
        if (typeof rol === 'string') {
          const trimmed = rol.trim();
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            // Try to parse JSON array/object
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed) && parsed.length) {
                // Prefer collaborator roles when multiple present
                const preferred = ['ovtcolaboradormp', 'ovtcolaboradorcm'];
                for (const p of preferred) {
                  if (parsed.includes(p)) {
                    rol = p;
                    break;
                  }
                }
                // if none matched, fall back to first available collaborator-like value
                if ((!rol || typeof rol !== 'string') && parsed.length) {
                  // try to find any value that contains 'colaborador'
                  const foundCollab = parsed.find((x: any) => String(x).toLowerCase().includes('colaborador'));
                  if (foundCollab) rol = String(foundCollab);
                  else rol = String(parsed[0]);
                }
              } else if (typeof parsed === 'string') {
                rol = parsed;
              }
            } catch {}
          } else if (trimmed.includes(',')) {
            // comma separated list
            const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
            const preferred = ['ovtcolaboradormp', 'ovtcolaboradorcm'];
            let picked: string | null = null;
            for (const p of preferred) if (parts.includes(p)) { picked = p; break; }
            if (!picked) {
              // try to find any that contains 'colaborador'
              const found = parts.find((x) => x.toLowerCase().includes('colaborador'));
              if (found) picked = found;
            }
            if (!picked && parts.length) picked = parts[0];
            if (picked) rol = picked;
          }
        }
      } catch (e) {
        // ignore normalization errors
      }

      // Ensure that we send a collaborator role to the Estado endpoint: prefer ovtcolaboradormp or ovtcolaboradorcm
      try {
        const pref = ['ovtcolaboradormp', 'ovtcolaboradorcm'];
        if (typeof rol === 'string') {
          const low = rol.toLowerCase();
          for (const p of pref) if (low === p || low.includes(p)) { rol = p; break; }
        }
        if (!rol || (typeof rol === 'string' && !rol.toLowerCase().includes('colaborador'))) {
          // default to ovtcolaboradormp if nothing collaborator-like found
          rol = 'ovtcolaboradormp';
        }
      } catch {}

      return { idColaborador: id, rol };
    } catch {
      return { idColaborador: null, rol: null };
    }
  }

  // Convertir un IEstado -> ITiempoRegistrado para mostrar en la tabla
  private mapEstadoToTiempo(e: IEstado): ITiempoRegistrado {
    const parseDateTime = (fecha: any, hora?: string): Date | null => {
      try {
        if (!fecha && !hora) return null;
        let dateObj: Date | null = null;
        if (fecha instanceof Date) dateObj = fecha;
        else if (typeof fecha === 'string') {
          const d = new Date(fecha);
          if (!isNaN(d.getTime())) dateObj = d;
          else {
            // formatos 'yyyy-MM-dd' o 'dd/MM/yyyy'
            const m1 = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m1) dateObj = new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]));
            const m2 = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
            if (m2) dateObj = new Date(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1]));
          }
        } else if (typeof fecha === 'number') {
          const d = new Date(fecha);
          if (!isNaN(d.getTime())) dateObj = d;
        }

        if (!dateObj) return null;

        if (hora) {
          const timeMatch = String(hora).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
          if (timeMatch) {
            const hh = Number(timeMatch[1]);
            const mm = Number(timeMatch[2]);
            const ss = timeMatch[3] ? Number(timeMatch[3]) : 0;
            return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hh, mm, ss);
          }
          // compact HHmm
          const compact = String(hora).match(/^(\d{2})(\d{2})$/);
          if (compact) {
            const hh = Number(compact[1]);
            const mm = Number(compact[2]);
            return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hh, mm, 0);
          }
        }

        return dateObj;
      } catch {
        return null;
      }
    };

    const tiempo: any = {};
    tiempo.id = (e.tiempoRegistradoid ?? e.estadoid) as any;
    tiempo.cantidadHoras = Number(e.cantidadHoras ?? 0);
    
    // Mapear tipoHora usando el mapa de nombres
    const tipoHoraId = e.tipoHoraId ?? e.tipohoraid;
    tiempo.tipoHora = tipoHoraId ? (this.tipoHoraMap.get(String(tipoHoraId)) || e.tipoHora || '') : (e.tipoHora || '');
    
    tiempo.fechaHoraInicio = parseDateTime(e.fechaInicio, e.horaInicio);
    tiempo.fechaHoraFin = parseDateTime(e.fechaFin, e.horaFin);
    tiempo.estadoJefe = this.normalizeEstado(e.estadoJefe);
    tiempo.estadoGh = this.normalizeEstado(e.estadoGh);
    tiempo.estadoPago = this.normalizeEstado(e.estadoPago);
    tiempo.nombreColaborador = e.nombreColaborador || '';
    tiempo.proceso = e.proceso || e.procesonombre || '';
    tiempo.motivoRechazoJefe = e.motivoRechazoJefe || undefined;
    tiempo.motivoRechazoGh = e.motivoRechazoGh || undefined;
    tiempo.documento = e.documento || e.identificacion || 0;
    tiempo.idColaborador = e.idColaborador || e.colaboradorid || '';
    tiempo.eliminado = 0;
    tiempo.usuarioAplicativo = e.usuarioAplicativo || e.usuarioaplicativo || '';
    tiempo.idEstado = Number(e.estadoid ?? 0);
    
    // Campos adicionales para el modal
    tiempo.regional = e.regional || e.regionalnombre || '';
    tiempo.jefe = e.jefe || e.jefeNombre || e.nombrejefe || '';
    tiempo.justificacion = e.justificacion || e.descripcion || e.observacion || '';
    tiempo.evidencia = e.evidencia || e.gestion || e.comoEvidencia || '';
    tiempo.entregable = e.entregable || e.entregablePresentado || '';
    
    // IDs para referencias
    tiempo.regionalId = e.regionalid || e.regionalId;
    tiempo.jefeId = e.jefeid || e.jefeId;
    tiempo.procesoId = e.procesoid || e.procesoId;
    tiempo.evidenciaId = e.gestionid || e.gestionId;
    tiempo.tipoHoraId = tipoHoraId;

    // Calcular campos derivados
    try {
      if (tiempo.fechaHoraInicio && tiempo.fechaHoraFin) {
        const start = new Date(tiempo.fechaHoraInicio).getTime();
        const end = new Date(tiempo.fechaHoraFin).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          const mins = Math.round((end - start) / (1000 * 60));
          tiempo._totalMinutes = mins;
          tiempo.cantidadHorasDisplay = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
          tiempo.cantidadHoras = Number((mins / 60).toFixed(2));
        }
      }
    } catch {}

    return tiempo as ITiempoRegistrado;
  }

  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  // horaInicio/horaFin removed: we work with date-only filtering

  minDate: Date | null = null;
  maxDate: Date | null = null;
  startAt: Date | null = null;

  private _initDateLimits() {
    const now = new Date();
    // maxDate: último día del mes actual
    this.maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // minDate: first day of month, two months before current month
    const minMonth = now.getMonth() - 2;
    this.minDate = new Date(now.getFullYear(), minMonth, 1);
    // startAt: default view when opening picker -> current date (or maxDate if needed)
    this.startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  openPicker(which: 'inicio' | 'fin', pickerRef: any) {
    this.pickerService.current = which;
    // abrir el selector programáticamente (la plantilla también lo hace)
    try {
      pickerRef.open();
    } catch {}
  }

  onFechaChange() {
    this.updateFilter();
  }

  limpiarFechas() {
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

      // Filtro texto: incluir tipoHora, estados, colaborador y proceso
      const hayTexto = (f.text || '') !== '';
      if (hayTexto) {
        const haystack = `${data.tipoHora || ''} ${data.estadoJefe || ''} ${
          data.estadoGh || ''
        } ${data.estadoPago || ''} ${data.nombreColaborador || ''} ${data.proceso || ''}`.toLowerCase();
        if (!haystack.includes(f.text)) {
          return false;
        }
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

  // Normaliza un valor de estado recibido desde la API a los valores esperados
  private normalizeEstado(val: any): string | null {
    if (val == null) return null;
    try {
      const s = String(val).trim();
      if (!s) return null;
      const low = s.toLowerCase();
      if (low.includes('aprob')) return 'Aprobado';
      if (low.includes('rechaz')) return 'Rechazado';
      if (low.includes('pend')) return 'Pendiente';
      if (low.includes('no') && low.includes('pag')) return 'No Pagado';
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    } catch (e) {
      return null;
    }
  }

  // Asegura la asignación de paginator y sort al dataSource, incluso si la
  // tabla fue renderizada condicionalmente (p. ej. *ngIf) y los ViewChild
  // aún no estaban disponibles en el primer ciclo.
  private assignTableControls() {
    try {
      // si el dataSource no está listo, no intentamos
      if (!this.dataSource) return;
      // Si aún no tenemos sort/paginator (porque la tabla se renderiza con *ngIf), reintentamos
      const haveSort = !!this.sort;
      const havePag = !!this.paginator;

      if (!haveSort || !havePag) {
        // intentar reasignar hasta _assignMaxAttempts veces
        if (this._assignAttempts < this._assignMaxAttempts) {
          this._assignAttempts++;
          // pequeña espera para que Angular renderice la tabla si estaba condicionada
          setTimeout(() => this.assignTableControls(), 100);
          return;
        } else {
    
        }
      }

      // asignar si disponible
      if (!this.dataSource.paginator && this.paginator) this.dataSource.paginator = this.paginator;
      if (!this.dataSource.sort && this.sort) this.dataSource.sort = this.sort;
      this._assignAttempts = 0;

      // Asegurar sortingDataAccessor esté presente
      if (!this.dataSource.sortingDataAccessor) {
        this.dataSource.sortingDataAccessor = (item: any, property: string) => {
          try {
            const val = item[property];
            if (property === 'fechaHoraInicio' || property === 'fechaHoraFin') {
              const d = val ? new Date(val) : null;
              return d && !isNaN(d.getTime()) ? d.getTime() : -Infinity;
            }
            if (property === 'cantidadHoras') {
              if (typeof val === 'number') return val;
              if (item._totalMinutes != null) return Number(item._totalMinutes);
              const n = Number(val);
              return isNaN(n) ? -Infinity : n;
            }
            return (val == null ? '' : String(val)).toLowerCase();
          } catch (e) {
            return '';
          }
        };
      }
    } catch (e) {
      // no bloquear por errores de asignación temprana

    }
  }

  // Helper para diagnóstico del parseo (extrae lo que antes se imprimía inline)
  private logParsed(parsed: ITiempoRegistrado[]) {
    try {

    } catch (e) {}
  }
}
