import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
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
import { EstadoService } from '../../../service/estado/estado.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-ver-tiempo-modal',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    FormsModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    Timepicker,
  ],
  templateUrl: './ver-tiempo-modal.html',
  styleUrls: ['./ver-tiempo-modal.css'],
})
export class VerTiempoModal {
  // Propiedades del modelo de formulario / UI usadas por la plantilla
  cedula: string = '';
  colaborador: string = '';
  regional: string = '';
  tipoJefe: string = '';
  tipoHora: string = '';
  estadoJefe: string = '';
  estadoGh: string = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  horaInicio: string = '';
  horaFin: string = '';
  proceso: string = '';
  justificacion: string = '';
  evidencia: string = '';
  entregable: string = '';
  motivoRechazo: string = '';
  motivoRechazoJefe: string = '';
  motivoRechazoGh: string = '';
  usuarioAplicativo: string = '';

  // auxiliares para autocompletados y selectores
  showOptions = false;
  filteredOptions: string[] = [];
  options: string[] = [];

  // ids correspondientes a los elementos seleccionados (cuando estén disponibles)
  regionalId: number | null = null;
  jefeId: number | null = null;
  procesoId: number | null = null;
  evidenciaId: number | null = null;
  horaId: number | null = null;

  // controles de visibilidad del timepicker
  mostrarRelojInicio = false;
  mostrarRelojFin = false;

  showJefeOptions = false;
  filteredJefes: string[] = [];
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

  CustomDatepickerHeader = CustomDatepickerHeader;

  constructor(
    public dialogRef: MatDialogRef<VerTiempoModal>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private regService: RegonalesService,
    private jefeService: JefeService,
    private procesoService: ProcesoService,
    private gestionService: GestionService,
    private tipoHoraService: TipoHoraService,
    private usuarioService: UsuarioService, 
    private authService: AuthService,
    private estadoService: EstadoService
  ) {}

  ngOnInit(): void {
    this.populateFromData(this.data || {});
  }

  private populateFromData(d: any) {
    console.log('Datos recibidos en el modal:', d);
    
    // Mapear campos directamente desde los datos que ya vienen completos
    this.cedula = d.documento || d.identificacion || d.cedula || '';
    this.colaborador = d.nombreColaborador || '';
    this.regional = d.regionalNombre || d.regional || d.regionalnombre || '';
    this.tipoJefe = d.nombreJefe || d.jefe || d.jefeNombre || d.nombrejefe || '';
    this.tipoHora = d.tipoHora || '';
    this.fechaInicio = d.fechaInicio ? new Date(d.fechaInicio) : null;
    this.fechaFin = d.fechaFin ? new Date(d.fechaFin) : null;
    this.horaInicio = this.formatTo12HourTime(d.horaInicio || '');
    this.horaFin = this.formatTo12HourTime(d.horaFin || '');
    this.justificacion = d.justificacion || d.descripcion || d.observacion || '';
    this.entregable = d.entregable || d.entregablePresentado || '';
    this.proceso = d.proceso || d.procesonombre || d.procesoNombre || '';
    this.evidencia = d.evidencia || d.gestion || d.comoEvidencia || '';
    
    // Asignar estados directamente
    this.estadoJefe = d.estadoJefe || '';
    this.estadoGh = d.estadoGh || '';
    this.motivoRechazoJefe = d.motivoRechazoJefe || '';
    this.motivoRechazoGh = d.motivoRechazoGh || '';
    
    this.usuarioAplicativo = d.usuarioAplicativo || d.usuarioaplicativo || d.usuario || d.usuarioTexto || '';
    
    // Guardar IDs para referencia
    this.regionalId = d.regionalId || d.regionalid;
    this.jefeId = d.jefeId || d.jefeid;
    this.procesoId = d.procesoId || d.procesoid;
    this.evidenciaId = d.gestionId || d.gestionid || d.evidenciaId;
    this.horaId = d.tipoHoraId || d.tipohoraid;
    
    console.log('Datos mapeados en el modal:', {
      cedula: this.cedula,
      colaborador: this.colaborador,
      regional: this.regional,
      tipoJefe: this.tipoJefe,
      tipoHora: this.tipoHora,
      proceso: this.proceso,
      evidencia: this.evidencia,
      justificacion: this.justificacion,
      entregable: this.entregable,
      usuarioAplicativo: this.usuarioAplicativo
    });
  }
  


  private normalizeEstado(val: any): string {
    if (val == null) return '';
    const s = String(val).trim();
    if (!s) return '';
    const low = s.toLowerCase();
    
    // Verificaciones exactas primero
    if (low === 'rechazado') return 'Rechazado';
    if (low === 'aprobado') return 'Aprobado';
    if (low === 'pendiente') return 'Pendiente';
    
    // Luego verificaciones con includes
    if (low.includes('rechaz')) return 'Rechazado';
    if (low.includes('aprob')) return 'Aprobado';
    if (low.includes('pend')) return 'Pendiente';
    if (low.includes('no') && low.includes('pag')) return 'No Pagado';
    
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  private formatTo12HourTime(value: any): string {
    if (!value && value !== 0) return '';
    try {
      if (value instanceof Date) return this.dateTo12Hour(value);
      if (typeof value === 'number') return this.dateTo12Hour(new Date(value));
      if (typeof value === 'string') {
        const v = value.trim();
        const iso = v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/);
        if (iso) {
          const dt = new Date(v);
          return this.dateTo12Hour(dt);
        }
        const spaceDt = v.match(/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(:\d{2})?/);
        if (spaceDt) {
          const parts = v.split(/\s+/);
          const dt = new Date(parts[0] + 'T' + parts[1]);
          return this.dateTo12Hour(dt);
        }
        const timeOnly = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (timeOnly) {
          let h = Number(timeOnly[1]);
          const m = timeOnly[2];
          const meridian = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          return `${h.toString().padStart(2, '0')}:${m} ${meridian}`;
        }
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

  private dateTo12Hour(d: Date): string {
    if (!d || isNaN(d.getTime())) return '';
    let hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, '0');
    const meridian = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh.toString().padStart(2, '0')}:${mm} ${meridian}`;
  }

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
  }

  filterJefeOptions() {
    const q = (this.tipoJefe || '').toLowerCase();
    this.filteredJefes = this.jefes.filter((j) => j.toLowerCase().includes(q));
  }

  selectJefe(jefe: string) {
    this.tipoJefe = jefe;
    this.showJefeOptions = false;
  }

  filterHoraOptions() {
    const q = (this.tipoHora || '').toLowerCase();
    this.filteredHoras = this.horas.filter((h) => h.toLowerCase().includes(q));
  }

  selectHora(hora: string) {
    this.tipoHora = hora;
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

  isRechazado(): boolean {
    const jefeRechazado = (this.estadoJefe || '').toString().toLowerCase().includes('rechaz');
    const ghRechazado = (this.estadoGh || '').toString().toLowerCase().includes('rechaz');
    return jefeRechazado || ghRechazado;
  }

  getMotivoRechazo(): string {
    const jefeRechazado = (this.estadoJefe || '').toString().toUpperCase().includes('RECHAZ');
    const ghRechazado = (this.estadoGh || '').toString().toUpperCase().includes('RECHAZ');
    
    if (jefeRechazado && this.motivoRechazoJefe) {
      return this.motivoRechazoJefe;
    }
    if (ghRechazado && this.motivoRechazoGh) {
      return this.motivoRechazoGh;
    }
    return this.motivoRechazo;
  }
}