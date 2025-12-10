import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { CustomDatepickerHeader } from '../../picker/custom-datepicker-header';
import { Timepicker } from '../../timepicker/timepicker';
import { RegonalesService } from '../../../service/regionales/reginales.service';
import { JefeService } from '../../../service/jefe/jefe.service';
import { ProcesoService } from '../../../service/proceso/proceso.service';
import { GestionService } from '../../../service/gestion/gestion.service';
import { TipoHoraService } from '../../../service/tipoHora/tipo-hora.service';
import { UsuarioService } from '../../../service/usuarios/usuario.service';
import { AuthService } from '../../../service/auth/auth.service';
import { take } from 'rxjs/operators';
import { EstadoService } from '../../../service/estado/estado.service';

const ROLE_FALLBACK = 'ovtcolaboradormp';

@Component({
  selector: 'app-ver-tiempo-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    Timepicker,
  ],
  templateUrl: './editar-tiempo-modal.html',
  styleUrls: ['./editar-tiempo-modal.css'],
})
export class EditarTiempoModal {
  constructor(
    public dialogRef: MatDialogRef<EditarTiempoModal>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private regService: RegonalesService,
    private jefeService: JefeService,
    private procesoService: ProcesoService,
    private gestionService: GestionService,
    private tipoHoraService: TipoHoraService, 
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private estadoService: EstadoService,
  ) {}

  // Propiedades del modelo de formulario / UI usadas por la plantilla
  cedula: string = '';
  colaborador: string = '';
  regional: string = '';
  tipoJefe: string = '';
  tipoHora: string = '';
  estadoJefe: string = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  horaInicio: string = '';
  horaFin: string = '';
  proceso: string = '';
  justificacion: string = '';
  evidencia: string = '';
  entregable: string = '';
  motivoRechazo: string = '';
  usuarioAplicativo: string = '';

  // Validation state
  invalidFields: { [key: string]: boolean } = {};

  // auxiliares para autocompletados y selectores
  showOptions = false;
  filteredOptions: string[] = [];
  options: string[] = [];

  showJefeOptions = false;
  filteredJefes: string[] = [];
  jefesList: any[] = [];
  jefes: string[] = [];

  showHoraOptions = false;
  filteredHoras: string[] = [];
  horas: string[] = [];

  showProcesoOptions = false;
  filteredProcesos: string[] = [];
  procesos: string[] = [];

  showEvidenciaOptions = false;
  filteredEvidencias: string[] = [];
  evidencias: string[] = [];

  minDate: Date | null = null;
  maxDate: Date | null = null;
  startAt: Date | null = null;

  mostrarRelojInicio = false;
  mostrarRelojFin = false;

  // ids correspondientes a los elementos seleccionados (cuando estén disponibles)
  regionalId: number | null = null;
  jefeId: number | null = null;
  procesoId: number | null = null;
  evidenciaId: number | null = null;
  horaId: number | null = null;

  ngOnInit(): void {
    // inicializar con lo que nos haya pasado el llamador
    this.populateFromData(this.data || {});

    // refrescar desde endpoint si tenemos id del registro
    const incoming = this.data || {};
    const potentialId = incoming.id ?? incoming.idTiempoRegistrado ?? incoming.id_tiempo_registrado ?? incoming.tiempoRegistradoid ?? incoming.tiempoRegistradoId ?? null;
    if (potentialId != null) {
      try {
        this.authService.user$.pipe(take(1)).subscribe((payload: any) => {
          const user = payload?.user || payload?.usuario || payload;
          let idCol: any = user?.usuario ?? user?.usuarioId ?? user?.idColaborador ?? user?.id ?? user?.identificacion ?? null;
          if (!idCol) {
            const raw = localStorage.getItem('usuario') || localStorage.getItem('usuarioRes') || localStorage.getItem('user') || localStorage.getItem('auth');
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                idCol = parsed?.id ?? parsed?.usuarioId ?? parsed?.idColaborador ?? parsed?.usuario ?? idCol;
              } catch {
                idCol = raw;
              }
            }
          }
          const rol = this.authService.getRole() || localStorage.getItem('rol') || localStorage.getItem('role') || '';
          if (!idCol || !rol) return;
          this.estadoService.getEstados(idCol, rol, [potentialId]).subscribe({
            next: (resp: any) => {
              const list: any[] = Array.isArray(resp) ? resp : (resp?.data || []);
              if (list && list.length) {
                this.data = list[0];
                this.populateFromData(this.data || {});
              }
            },
            error: (err) => {}
          });
        });
      } catch {}
    }
  }

  private populateFromData(d: any) {
    try {
      this.authService.user$.pipe(take(1)).subscribe((payload: any) => {
        if (!payload) return;
        const user = payload?.user || payload?.usuario || payload;
        const topName =
          payload?.nombreColaborador ??
          payload?.nombre ??
          user?.nombreColaborador ??
          user?.nombre ??
          user?.name ??
          user?.usuario ??
          null;
        if (topName && String(topName).trim() !== '') this.colaborador = String(topName).trim();

        const authDoc = user?.identificacion ?? user?.documento ?? user?.cedula ?? user?.numeroDocumento ?? user?.numero_identificacion ?? null;
        if (authDoc != null && String(authDoc).trim() !== '') this.cedula = String(authDoc).trim();
      });
    } catch {}
      d = d || {};
    this.estadoJefe = d.estadoJefe || d.estadojefe || d.estado_jefe || d.estado || '';
    const dataCedula = String(
      d.colaborador?.cedula ?? d.colaborador?.identificacion ?? d.colaborador?.documento ?? d.documento ?? d.cedula ?? d.identificacion ?? (d.colaboradorid != null ? d.colaboradorid : '') ?? ''
    ).trim();
    if (!this.cedula || String(this.cedula).trim() === '') this.cedula = dataCedula;
    const dataColaborador = d.colaboradorNombre || d.colaborador?.nombre || d.colaborador?.nombreCompleto || (d.colaborador?.nombres && d.colaborador?.apellidos ? `${d.colaborador.nombres} ${d.colaborador.apellidos}` : '') || d.nombreColaborador || d.nombre || '';
    if (!this.colaborador || String(this.colaborador).trim() === '') this.colaborador = dataColaborador;
    const collaboratorIdFromData = d.colaboradorid ?? d.colaboradorId ?? d.colaborador?.id ?? null;
    if (!this.colaborador && collaboratorIdFromData != null) {
      const idNum = Number(collaboratorIdFromData);
      if (!Number.isNaN(idNum) && idNum > 0) this.fetchUsuarioAndPopulate(idNum);
    }
    this.regional = d.regional || d.regionalnombre || d.regionalNombre || d.regional?.nombre || d.regional?.nombreRegional || '';
    this.tipoJefe = d.jefe || d.jefeNombre || d.jefe?.nombre || d.jefe?.nombreCompleto || d.responsable || '';
    this.tipoHora = d.tipoHora || d.tipohora || d.tipohoraid || d.tipoHoraNombre || d.horaTipo || '';
    this.fechaInicio = d.fechaHoraInicio ? new Date(d.fechaHoraInicio) : d.fechainicio ? new Date(d.fechainicio) : null;
    this.fechaFin = d.fechaHoraFin ? new Date(d.fechaHoraFin) : d.fechafin ? new Date(d.fechafin) : null;
    this.horaInicio = this.formatTo12HourTime(d.horaInicio ?? d.horainicio ?? d.fechaHoraInicio ?? '');
    this.horaFin = this.formatTo12HourTime(d.horaFin ?? d.horafin ?? d.fechaHoraFin ?? '');
    this.proceso = d.proceso || d.procesonombre || d.proceso?.nombre || d.procesoNombre || '';
    this.justificacion = d.justificacion || d.justificacionTexto || d.descripcion || d.observacion || '';
    this.evidencia = d.comoEvidencia || d.evidencia || d.gestion?.nombre || d.evidenciaNombre || '';
    this.entregable = d.entregable || d.entregablePresentado || d.entregablePresentadoTexto || '';
    this.usuarioAplicativo = d.usuarioAplicativo || d.usuarioaplicativo || d.usuarioAplicativoTexto || d.usuarioAplicativoText || d.usuarioaplica || d.usuario || '';
    this.options = d.regionalesList || [];
    this.filteredOptions = [...this.options];
    this.jefes = d.jefesList || [];
    this.filteredJefes = [...this.jefes];
    this.horas = d.horasList || [];
    this.filteredHoras = [...this.horas];
    this.procesos = d.procesosList || [];
    this.filteredProcesos = [...this.procesos];
    this.evidencias = d.evidenciasList || [];
    this.filteredEvidencias = [...this.evidencias];
    this.regionalId = d.regionalid ?? d.regionalId ?? d.regional?.id ?? null;
    this.jefeId = d.jefeid ?? d.jefeId ?? d.jefe?.id ?? null;
    this.procesoId = d.procesoid ?? d.procesoId ?? d.proceso?.id ?? null;
    this.evidenciaId = d.gestionid ?? d.gestionId ?? d.evidenciaId ?? d.evidencia?.id ?? null;
    this.horaId = d.tipohoraid ?? d.tipoHoraId ?? d.horaId ?? null;
    if (!this.options || this.options.length === 0) this.loadRegionales();
    if (!this.horas || this.horas.length === 0) this.loadTipoHoras();
    if (!this.procesos || this.procesos.length === 0) this.loadProcesos();
    if (!this.evidencias || this.evidencias.length === 0) this.loadEvidencias();
    if ((this.jefes?.length || 0) === 0) this.loadJefes();
    this.resolveNamesFromIds();
  }

  private fetchUsuarioAndPopulate(id: number) {
    try {
      this.usuarioService.getId(id).subscribe({
        next: (u) => {
          if (u) {
            // Prefer documento / identificacion / cedula from the user object
            const doc =
              (u as any).documento ??
              (u as any).identificacion ??
              (u as any).cedula ??
              (u as any).numeroDocumento ??
              null;
            if (doc != null) this.cedula = String(doc).trim();
            const nombre = (u.nombre || (u as any).nombres || '').toString().trim();
            const apellidos = (u.apellidos || (u as any).apellido || '').toString().trim();
            let fullName = `${nombre} ${apellidos}`.trim();
            if (!fullName) {
              const maybeFull = (u as any).nombreCompleto || (u as any).nombre_completo || '';
              fullName = (maybeFull || '').toString().trim();
            }
            this.colaborador = fullName || `${nombre} ${apellidos}`.trim();
          }
        },
        error: (err) => {},
      });
    } catch (e) {

    }
  }

  private dateTo12Hour(d: Date): string {
    if (!d || isNaN(d.getTime())) return '';
    let hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, '0');
    const meridian = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh.toString().padStart(2, '0')}:${mm} ${meridian}`;
  }

  private formatTo12HourTime(value: any): string {
    if (!value && value !== 0) return '';
    try {
      // If value is a Date
      if (value instanceof Date) return this.dateTo12Hour(value);
      // If value is a number (timestamp)
      if (typeof value === 'number') return this.dateTo12Hour(new Date(value));
      if (typeof value === 'string') {
        const v = value.trim();
        // ISO datetime like '2023-06-22T15:40:00Z' or with offset
        const iso = v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/);
        if (iso) {
          const dt = new Date(v);
          return this.dateTo12Hour(dt);
        }
        // Date + time with space '2023-06-22 15:40:00'
        const spaceDt = v.match(/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(:\d{2})?/);
        if (spaceDt) {
          const parts = v.split(/\s+/);
          const dt = new Date(parts[0] + 'T' + parts[1]);
          return this.dateTo12Hour(dt);
        }
        // Time only '15:40:00' or '15:40'
        const timeOnly = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (timeOnly) {
          let h = Number(timeOnly[1]);
          const m = timeOnly[2];
          const meridian = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          return `${h.toString().padStart(2, '0')}:${m} ${meridian}`;
        }
        // Already in 12-hour format like '03:40 PM' — normalize spacing/casing
        const maybe12 = v.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
        if (maybe12) {
          const hh = maybe12[1].padStart(2, '0');
          const mm = maybe12[2];
          const mer = maybe12[3].toUpperCase();
          return `${hh}:${mm} ${mer}`;
        }
      }
    } catch (e) {

    }
    return '';
  }

  // Data loaders
  private loadRegionales(): void {
    this.regService.getAll().subscribe({
      next: (data) => {
        (this as any).regionalesList = Array.isArray(data) ? data : [];
        this.options = (this as any).regionalesList.map((r: any) => r.nombre);
        this.filteredOptions = [...this.options];
        this.resolveNamesFromIds();
      },
      error: (err) => {},
    });
  }

  private loadTipoHoras(): void {
    this.tipoHoraService.getTipoHoras().subscribe({
      next: (data) => {
        (this as any).horasList = Array.isArray(data) ? data : [];
        this.horas = (this as any).horasList.map((r: any) => r.nombre);
        this.filteredHoras = [...this.horas];

        this.resolveNamesFromIds();
      },
      error: (err) => {},
    });
  }

  private loadProcesos(): void {
    this.procesoService.getProcesos().subscribe({
      next: (data) => {
        (this as any).procesosList = Array.isArray(data) ? data : [];
        this.procesos = (this as any).procesosList.map((r: any) => r.nombre);
        this.filteredProcesos = [...this.procesos];
        this.resolveNamesFromIds();
      },
      error: (err) => {},
    });
  }

  private loadEvidencias(): void {
    this.gestionService.getGestion().subscribe({
      next: (data) => {
        (this as any).evidenciasList = Array.isArray(data) ? data : [];
        this.evidencias = (this as any).evidenciasList.map(
          (r: any) => r.nombre
        );
        this.filteredEvidencias = [...this.evidencias];
        this.resolveNamesFromIds();
      },
      error: (err) => {},
    });
  }


  private loadJefes(): void {
    this.jefeService.getJefes().subscribe({
      next: (data) => {
        this.jefesList = data;
        this.jefes = Array.from(new Set(data.map((j: any) => j.nombre)));
        this.filteredJefes = [...this.jefes];
        
        // Resolver nombres después de cargar
        this.resolveNamesFromIds();
      },
      error: (err) => {},
    });
  }

  // Si la carga entrante solo contiene ids, pero tenemos listas, resolver y completar los nombres para mostrar
  private resolveNamesFromIds() {
    try {
      // regional
      if ((!this.regional || this.regional === '') && this.regionalId != null) {
        const found = (this as any).regionalesList?.find?.(
          (r: any) =>
            r.id === this.regionalId || r.id === Number(this.regionalId)
        );
        if (found) this.regional = found.nombre;
      }
      // tipo de hora
      if ((!this.tipoHora || this.tipoHora === '') && this.horaId != null) {
        const found = (this as any).horasList?.find?.(
          (h: any) => h.id === this.horaId || h.id === Number(this.horaId)
        );
        if (found) this.tipoHora = found.nombre;
      }
      // jefe
      if ((!this.tipoJefe || this.tipoJefe === '') && this.jefeId != null) {
        const found = (this as any).jefesList?.find?.(
          (j: any) => j.id === this.jefeId || j.id === Number(this.jefeId)
        );
        if (found) this.tipoJefe = found.nombre;
      }
      // proceso
      if ((!this.proceso || this.proceso === '') && this.procesoId != null) {
        const found = (this as any).procesosList?.find?.(
          (p: any) => p.id === this.procesoId || p.id === Number(this.procesoId)
        );
        if (found) this.proceso = found.nombre;
      }
      // evidencia (gestion)
      if (
        (!this.evidencia || this.evidencia === '') &&
        this.evidenciaId != null
      ) {
        const found = (this as any).evidenciasList?.find?.(
          (e: any) =>
            e.id === this.evidenciaId || e.id === Number(this.evidenciaId)
        );
        if (found) this.evidencia = found.nombre;
      }
      // tipoHora: if it's empty but we have horaId, or if tipoHora currently holds an id, resolve to name
      const isNumeric = (v: any) =>
        v !== null && v !== undefined && !Number.isNaN(Number(v));
      if (
        (this.tipoHora == null || this.tipoHora === '') &&
        this.horaId != null
      ) {
        const found = (this as any).horasList?.find?.(
          (h: any) => h.id === this.horaId || h.id === Number(this.horaId)
        );
        if (found) this.tipoHora = found.nombre;
      } else if (isNumeric(this.tipoHora)) {
        // tipoHora currently contains an id (string or number) — replace with name
        const idVal = Number(this.tipoHora);
        const found = (this as any).horasList?.find?.(
          (h: any) => h.id === idVal
        );
        if (found) {
          this.horaId = idVal;
          this.tipoHora = found.nombre;
        }
      }
    } catch (e) {

    }
  }

  // Exponer la clase del componente header para que el binding de la plantilla [calendarHeaderComponent] pueda referenciarla
  CustomDatepickerHeader = CustomDatepickerHeader;

  // Manejadores de entrada / filtros simples
  onCedulaInput(event: any) {
    this.cedula = (event.target.value || '').replace(/[^0-9\.\-]/g, '');
  }

  filterOptions() {
    const q = (this.regional || '').toLowerCase();
    this.filteredOptions = this.options.filter((o) =>
      o.toLowerCase().includes(q)
    );
  }
  selectOption(option: string) {
    this.regional = option;
    this.showOptions = false;
    const found = (this as any).regionalesList?.find?.(
      (r: any) => r.nombre === option
    );
    this.regionalId = found?.id ?? null;
    if (this.regionalId != null) this._loadJefesPorRegional();
    else this.loadJefes();
  }

  private _loadJefesPorRegional(): void {
    // Si hay regionalId, filtrar jefes por regional, sino cargar todos
    this.jefeService.getJefes().subscribe({
      next: (data) => {
        // Filtrar jefes por regional si existe regionalId
        let filteredData = data;
        if (this.regionalId != null) {
          filteredData = data.filter((j: any) => 
            j.regionalId === this.regionalId || 
            j.regional_id === this.regionalId ||
            j.regional?.id === this.regionalId
          );
        }
        
        this.jefesList = filteredData;
        this.jefes = Array.from(new Set(filteredData.map((j: any) => j.nombre)));
        this.filteredJefes = [...this.jefes];
        
        // Resolver nombres después de cargar
        this.resolveNamesFromIds();
      },
      error: (err) => {},
    });
  }


  filterJefeOptions() {
    const q = (this.tipoJefe || '').toLowerCase();
    this.filteredJefes = this.jefes.filter((j) => j.toLowerCase().includes(q));
  }
  selectJefe(jefe: string) {
    this.tipoJefe = jefe;
    const found = (this as any).jefesList?.find?.(
      (j: any) => j.nombre === jefe
    );
    this.jefeId = found ? found.id : null;
    this.showJefeOptions = false;
  }

  filterHoraOptions() {
    const q = (this.tipoHora || '').toLowerCase();
    this.filteredHoras = this.horas.filter((h) => h.toLowerCase().includes(q));
  }
  selectHora(hora: string) {
    this.tipoHora = hora;
    const found = (this as any).horasList?.find?.(
      (h: any) => h.nombre === hora
    );
    this.horaId = found ? found.id : null;
    this.showHoraOptions = false;
  }

  filterProcesoOptions() {
    const q = (this.proceso || '').toLowerCase();
    this.filteredProcesos = this.procesos.filter((p) =>
      p.toLowerCase().includes(q)
    );
  }
  selectProceso(p: string) {
    this.proceso = p;
    const found = (this as any).procesosList?.find?.(
      (pr: any) => pr.nombre === p
    );
    this.procesoId = found ? found.id : null;
    this.showProcesoOptions = false;
  }

  filterEvidenciaOptions() {
    const q = (this.evidencia || '').toLowerCase();
    this.filteredEvidencias = this.evidencias.filter((e) =>
      e.toLowerCase().includes(q)
    );
  }
  selectEvidencia(e: string) {
    this.evidencia = e;
    const found = (this as any).evidenciasList?.find?.(
      (ev: any) => ev.nombre === e
    );
    this.evidenciaId = found ? found.id : null;
    this.showEvidenciaOptions = false;
  }

  openPicker(_which: string, _picker: any) {
    // placeholder to match template usage; actual picker opens via template reference
  }

  onClose() {
    this.dialogRef.close({ action: 'close' });
  }

  onEdit() {
    if (!this.canEdit) {

      return;
    }
    this.dialogRef.close({ action: 'edit', item: this.data });
  }

  get canEdit(): boolean {
    const s = (this.estadoJefe || '').toString().trim().toLowerCase();
    return s === 'pendiente';
  }

  clearFieldError(fieldName: string): void {
    if (this.invalidFields[fieldName]) {
      this.invalidFields[fieldName] = false;
    }
  }
}
