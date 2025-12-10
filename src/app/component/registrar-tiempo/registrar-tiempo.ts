import { Component, HostListener, OnInit, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, NativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { Timepicker } from '../timepicker/timepicker';
import { CustomDatepickerHeader } from '../picker/custom-datepicker-header';
import { PickerService } from '../picker/picker.service';
import { SuccessModal } from '../shared/success-modal/success-modal';
import { ConfirmModal } from '../shared/confirm-modal/confirm-modal';
import { RegonalesService } from '../../service/regionales/reginales.service';
import { ServiceRegistroHoras } from '../../service/service-registro_horas/service-registro-horas.service';
import { TipoHoraService } from '../../service/tipoHora/tipo-hora.service';
import { ProcesoService } from '../../service/proceso/proceso.service';
import { GestionService } from '../../service/gestion/gestion.service';
import { JefeService } from '../../service/jefe/jefe.service';
import { AuthService } from '../../service/auth/auth.service';
import { ITiempoRegistrado } from '../../model/tiempoRegistrado/tiempo-registrado.model';



@Injectable()
class AppDateAdapter extends NativeDateAdapter {
  override format(date: Date): string {
    if (!date) return '';
    const day = this._to2digit(date.getDate());
    const month = this._to2digit(date.getMonth() + 1);
    return `${day}/${month}/${date.getFullYear()}`;
  }

  override parse(value: any): Date | null {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split('/');
    if (parts.length !== 3) return super.parse(value);
    const [day, month, year] = parts.map(Number);
    return !isNaN(day) && !isNaN(month) && !isNaN(year)
      ? new Date(year, month - 1, day)
      : null;
  }

  private _to2digit(n: number) {
    return n.toString().padStart(2, '0');
  }
}

const ROLE_FALLBACK = 'ovtcolaboradormp';
const CAMPO_EVIDENCIA_OTRO = 'Otro entregable';


@Component({
  selector: 'app-registrar-tiempo',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    Timepicker,
    MatIconModule,
    CustomDatepickerHeader,
    MatDialogModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  ],
  templateUrl: './registrar-tiempo.html',
  styleUrls: ['./registrar-tiempo.css'],
})
export class RegistrarTiempo implements OnInit, OnDestroy {

  CustomDatepickerHeader = CustomDatepickerHeader;

  
  private _pickerSubClear$?: Subscription;
  private _pickerSubOk$?: Subscription;
  private _pickerSubCancel$?: Subscription;
  private _authSub?: Subscription;

  
  formErrors: string[] = [];
  invalidFields: Record<string, boolean> = {};
  showSuccess = false;

 
  minDate: Date | null = null;
  maxDate: Date | null = null;
  startAt: Date | null = null;

  
  cedula = '';
  regional = '';
  tipoJefe = '';
  tipoHora = '';
  proceso = '';
  justificacion = '';
  entregable = '';
  evidencia = '';
  usuarioAplicativo = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  horaInicio = '';
  horaFin = '';
  mostrarRelojInicio = false;
  mostrarRelojFin = false;

  
  regionalId: number | null = null;
  jefeId: number | null = null;
  procesoId: number | null = null;
  evidenciaId: number | null = null;
  horaId: number | null = null;

  options: string[] = [];
  horas: string[] = [];
  procesos: string[] = [];
  jefes: string[] = [];
  evidencias: string[] = [];

  regionalesList: any[] = [];
  horasList: any[] = [];
  procesosList: any[] = [];
  jefesList: any[] = [];
  evidenciasList: any[] = [];

 
  filteredOptions: string[] = [];
  filteredHoras: string[] = [];
  filteredJefes: string[] = [];
  filteredEvidencias: string[] = [];
  filteredProcesos: string[] = [];

  
  showOptions = false;
  showHoraOptions = false;
  showJefeOptions = false;
  showEvidenciaOptions = false;
  showProcesoOptions = false;

 
  username: string | null = null;
  loggedUser: any = null;

  constructor(
    private router: Router,
    private pickerService: PickerService,
    private regService: RegonalesService,
    private registroService: ServiceRegistroHoras,
    private tipoHService: TipoHoraService,
    private procesoService: ProcesoService,
    private gestionService: GestionService,
    private jefeService: JefeService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

 
  ngOnInit(): void {
    this._initAuth();
    this._initPickerSubs();
    this._initDateLimits();
    this._loadCatalogos();
  }

  ngOnDestroy(): void {
    this._pickerSubClear$?.unsubscribe();
    this._pickerSubOk$?.unsubscribe();
    this._pickerSubCancel$?.unsubscribe();
    this._authSub?.unsubscribe();
  }

  
  private _initAuth(): void {
    this._authSub = this.authService.user$.subscribe((payload: any) => {
      const user = this._normalizeUser(payload);
      this.loggedUser = user;
      this.username = user?.usuario || user?.username || null;
    });
  }

  private _normalizeUser(payload: any): any {
    if (!payload) return null;
    if (typeof payload.usuario === 'string' && !payload.user) {
      return { usuario: payload.usuario, rol: payload.rol };
    }
    return payload.user || payload.usuario || payload;
  }

  private _initPickerSubs(): void {
    this._pickerSubClear$ = this.pickerService.onClear().subscribe(() => {
      const key = this.pickerService.current as 'inicio' | 'fin';
      this[key === 'inicio' ? 'fechaInicio' : 'fechaFin'] = null;
    });
    this._pickerSubOk$ = this.pickerService.onOk().subscribe();
    this._pickerSubCancel$ = this.pickerService.onCancel().subscribe();
  }

  private _initDateLimits(): void {
    const now = new Date();
    this.maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.minDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    this.startAt = new Date(now);
  }

  private _loadCatalogos(): void {
    this.loadRegionales();
    this.loadTipoHoras();
    this.loadProcesos();
    this.loadEvidencias();
    this.loadJefes();
  }

 
  loadRegionales(): void {
    this.regService.getAll().subscribe({
      next: (data) => {
        this.regionalesList = data;
        this.options = data.map((r) => r.nombre);
        this.filteredOptions = [...this.options];
      },
      error: (err) => {},
    });
  }

  loadTipoHoras(): void {
    this.tipoHService.getTipoHoras().subscribe({
      next: (data) => {
        this.horasList = data;
        this.horas = data.map((h) => h.nombre);
        this.filteredHoras = [...this.horas];
      },
      error: (err) => {},
    });
  }

  loadProcesos(): void {
    this.procesoService.getProcesos().subscribe({
      next: (data) => {
        this.procesosList = data;
        this.procesos = data.map((p) => p.nombre);
        this.filteredProcesos = [...this.procesos];
      },
      error: (err) => {},
    });
  }

  loadEvidencias(): void {
    this.gestionService.getGestion().subscribe({
      next: (data) => {
        this.evidenciasList = data;
        this.evidencias = data.map((e) => e.nombre);
        this.filteredEvidencias = [...this.evidencias];
      },
      error: (err) => {},
    });
  }

  loadJefes(): void {
    this.jefeService.getJefes().subscribe({
      next: (data) => {
        this.jefesList = data;
        this.jefes = Array.from(new Set(data.map((j) => j.nombre)));
        this.filteredJefes = [...this.jefes];
      },
      error: (err) => {},
    });
  }

  
  private parseTimeStringToDate(baseDate: Date | null, timeStr: string): Date | null {
    if (!baseDate || !timeStr) return null;
    const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;

    let hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    const meridian = m[3]?.toUpperCase();

    if (meridian === 'AM' && hour === 12) hour = 0;
    else if (meridian === 'PM' && hour < 12) hour += 12;

    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hour,
      minute
    );
  }

  
  selectOption(option: string): void {
    this.regional = option;
    this.showOptions = false;
    const found = this.regionalesList.find((r) => r.nombre === option);
    this.regionalId = found?.id ?? null;
    if (this.regionalId != null) this._loadJefesPorRegional(this.regionalId);
    else this.loadJefes();
  }

  selectHora(hora: string): void {
    this.tipoHora = hora;
    const found = this.horasList.find((h) => h.nombre === hora);
    this.horaId = found?.id ?? null;
    this.showHoraOptions = false;
  }

  selectJefe(jefe: string): void {
    this.tipoJefe = jefe;
    const found = this.jefesList.find((j) => j.nombre === jefe);
    this.jefeId = found?.id ?? null;
    this.showJefeOptions = false;
  }

  selectProceso(proceso: string): void {
    this.proceso = proceso;
    const found = this.procesosList.find((p) => p.nombre === proceso);
    this.procesoId = found?.id ?? null;
    this.showProcesoOptions = false;
  }

  selectEvidencia(evidencia: string): void {
    this.evidencia = evidencia;
    const found = this.evidenciasList.find((e) => e.nombre === evidencia);
    this.evidenciaId = found?.id ?? null;
    this.showEvidenciaOptions = false;
  }

  private _loadJefesPorRegional(regionalId: number): void {
    const role = this.authService.getRole()?.trim() || ROLE_FALLBACK;
    this.jefeService.getJefes(role, regionalId).subscribe({
      next: (data) => {
        this.jefesList = data;
        this.jefes = Array.from(new Set(data.map((j) => j.nombre)));
        this.filteredJefes = [...this.jefes];
      },
      error: (err) => {},
    });
  }

 
  private filter(query: string, list: readonly string[]): string[] {
    const q = query.toLowerCase();
    return query ? list.filter((i) => i.toLowerCase().includes(q)) : [...list];
  }

  filterOptions(): void {
    this.filteredOptions = this.filter(this.regional, this.options);
  }
  filterHoraOptions(): void {
    this.filteredHoras = this.filter(this.tipoHora, this.horas);
  }
  filterJefeOptions(): void {
    this.filteredJefes = this.filter(this.tipoJefe, this.jefes);
  }
  filterEvidenciaOptions(): void {
    this.filteredEvidencias = this.filter(this.evidencia, this.evidencias);
  }
  filterProcesoOptions(): void {
    this.filteredProcesos = this.filter(this.proceso, this.procesos);
  }

  
  private validateForm(): string[] {
    this.invalidFields = {};
    const missing: string[] = [];

    const req = (v: any, field: string, msg: string) => {
      if (!v || (typeof v === 'string' && v.trim() === '')) {
        missing.push(msg);
        this.invalidFields[field] = true;
      }
    };

    req(this.cedula, 'cedula', '* Cédula');
    req(this.regional, 'regional', '* Regional');
    req(this.tipoJefe, 'tipoJefe', '* Jefe');
    req(this.tipoHora, 'tipoHora', '* Tipo de Hora');
    req(this.proceso, 'proceso', '* Proceso');
    req(this.justificacion, 'justificacion', '* Justificación');
    req(this.evidencia, 'evidencia', '* Evidencia');
    req(this.fechaInicio, 'fechaInicio', '* Fecha Inicio');
    req(this.fechaFin, 'fechaFin', '* Fecha Fin');
    req(this.horaInicio, 'horaInicio', '* Hora Inicio');
    req(this.horaFin, 'horaFin', '* Hora Fin');
    req(this.usuarioAplicativo, 'usuarioAplicativo', '* Usuario Aplicativo');

    if (
      this.evidencia?.toLowerCase() === CAMPO_EVIDENCIA_OTRO.toLowerCase() &&
      !this.entregable?.trim()
    ) {
      missing.push('* Entregable (cuando evidencia es OTRO)');
      this.invalidFields['entregable'] = true;
    }

    return missing;
  }

  clearFieldError(field: string): void {
    if (this.invalidFields[field]) {
      delete this.invalidFields[field];
      this.formErrors = this.formErrors.filter(
        (m) => !m.toLowerCase().includes(field.toLowerCase())
      );
    }
  }

  
  onRegistrar(event?: Event): void {
    event?.preventDefault();
    const missing = this.validateForm();
    if (missing.length) {
      this.formErrors = missing;
      return;
    }

    const inicio = this.parseTimeStringToDate(this.fechaInicio, this.horaInicio);
    const fin = this.parseTimeStringToDate(this.fechaFin, this.horaFin);

    if (!inicio || !fin) {
      alert('Formato de hora inválido. Use hh:mm AM/PM');
      return;
    }
    if (fin.getTime() <= inicio.getTime()) {
      alert('La fecha/hora fin debe ser posterior a la fecha/hora inicio');
      return;
    }

    const { totalMinutes, cantidadHorasDisplay, cantidadHorasDecimal } =
      this._calcularHoras(inicio, fin);

    const payload: ITiempoRegistrado = {
      cantidadHoras: cantidadHorasDecimal,
      tipoHora: this.tipoHora,
      fechaHoraInicio: inicio,
      fechaHoraFin: fin,
      estadoJefe: 'PENDIENTE',
      estadoGh: 'PENDIENTE',
      estadoPago: 'PENDIENTE',
      documento: Number(this.cedula) || 0,
      idColaborador: this.loggedUser?.usuario || this.username || '',
      usuarioAplicativo: this.usuarioAplicativo,
      idEstado: 0,
    };

    const backendRequest = this._armarBackendRequest(inicio, fin, cantidadHorasDecimal);

    // Antes de crear, consultamos las horas reportadas en el mes actual
    const colaboradorId = this.loggedUser?.usuario || this.username || null;
    this.registroService.getHorasMesActual(colaboradorId).subscribe({
      next: (sumHorasMes) => {
        const totalConNuevo = Number((sumHorasMes || 0) + (cantidadHorasDecimal || 0));
        if (totalConNuevo >= 40) {
          const msg = `Está a punto de cumplir las horas extra permitidas. Horas actuales: ${sumHorasMes.toFixed(2)}. ` +
            `Horas a registrar: ${cantidadHorasDecimal.toFixed(2)}. Total: ${totalConNuevo.toFixed(2)}.`;
          const ref = this.dialog.open(ConfirmModal, {
            data: {
              title: 'Atención',
              message: msg,
              confirmText: 'Continuar',
              cancelText: 'Cancelar'
            },
            disableClose: false,
            panelClass: 'custom-confirm-dialog'
          });

          ref.afterClosed().subscribe((result: any) => {
            if (result && result.confirmed) {
              this._doCreate(backendRequest as any);
            } else {
              // El usuario canceló, no se crea el registro
            }
          });
        } else {
          // No alcanza el umbral, crear directamente
          this._doCreate(backendRequest as any);
        }
      },
      error: (err) => {
        // En caso de error al obtener las horas, procedemos con la creación (o puede ajustarse según política)
        console.error('Error al obtener horas del mes:', err);
        this._doCreate(backendRequest as any);
      }
    });
  }

  private _calcularHoras(inicio: Date, fin: Date) {
    const startDay = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const endDay = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
    const daysDiff = Math.round((endDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000));
    const startMinutesOfDay = inicio.getHours() * 60 + inicio.getMinutes();
    const endMinutesOfDay = fin.getHours() * 60 + fin.getMinutes();
    let totalMinutes = daysDiff * 24 * 60 + (endMinutesOfDay - startMinutesOfDay);
    if (totalMinutes <= 0) totalMinutes = Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / (60 * 1000)));

    const horasEnteras = Math.trunc(totalMinutes / 60);
    const minutosRestantes = ((totalMinutes % 60) + 60) % 60;
    const cantidadHorasDisplay = `${horasEnteras}:${minutosRestantes.toString().padStart(2, '0')}`;
    const cantidadHorasDecimal = Math.round((totalMinutes * 100) / 60) / 100;

    return { totalMinutes, cantidadHorasDisplay, cantidadHorasDecimal };
  }

  private _armarBackendRequest(inicio: Date, fin: Date, cantidadHorasDecimal: number) {
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const formatTime = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    return {
      fechainicio: formatDate(inicio),
      horainicio: formatTime(inicio),
      fechafin: formatDate(fin),
      horafin: formatTime(fin),
      justificacion: this.justificacion,
      entregable: this.entregable,
      eliminado: 0,
      colaboradorid: this.loggedUser?.usuario || this.username || null,
      documento: this.cedula || null,
      jefeid: this._resolverJefeId(),

      regionalid: this.regionalId ?? null,
      tipohoraid: this.horaId ?? null,
      procesoid: this.procesoId ?? null,
      gestionid: this.evidenciaId ?? null,
      cantidadHoras: Number(cantidadHorasDecimal.toFixed(2)),
      // if usuarioAplicativo not provided, fall back to authenticated username when available
      usuarioaplicativo: this.usuarioAplicativo || this.loggedUser?.usuario || this.username || '',
      nombrejefe: this._resolverJefeNombre() || '',
    };
  }

  private _doCreate(backendRequest: any): void {
    this.registroService.create(backendRequest as any).subscribe({
      next: () => this._mostrarExito(),
      error: (err) => {
        alert('Error al crear el registro. Ver consola para más detalles.');
        console.error(err);
      },
    });
  }

  private _resolverJefeNombre(): string | null {
    if (!this.tipoJefe) return null;
    // try to find the selected jefe in the loaded list, otherwise return the typed value
    const found = this.jefesList.find((j) => j.nombre === this.tipoJefe);
    return (found && (found.nombre as string)) || this.tipoJefe || null;
  }

  private _resolverJefeId(): number | string | null {
    if (this.jefeId != null) return this.jefeId;
    if (!this.tipoJefe) return null;
    const found = this.jefesList.find((j) => j.nombre === this.tipoJefe);
    return found?.usuarioRed ?? found?.usuario ?? null;
  }

  private _mostrarExito(): void {
    const ref = this.dialog.open(SuccessModal, {
      data: {
        title: 'Registro exitoso',
        message: 'Su información se ha registrado de manera correcta',
        logoSrc: `${window.location.origin}/assets/logoCoomeva.png`,
      },
      disableClose: true,
      panelClass: 'custom-success-dialog',
    });
    ref.afterClosed().subscribe(() => {
      this.limpiarFormulario();
      this.router.navigate(['menu/tiempoRegistrado']);
    });
  }

  
  onCedulaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
  }

  openPicker(which: 'inicio' | 'fin', pickerRef: any): void {
    this.pickerService.current = which;
    pickerRef?.open();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const inside = target.closest('.custom-floating, .custom-options, .custom-timepicker');
    if (!inside) {
      this.showOptions = false;
      this.showHoraOptions = false;
      this.showJefeOptions = false;
      this.showEvidenciaOptions = false;
      this.showProcesoOptions = false;
      this.mostrarRelojInicio = false;
      this.mostrarRelojFin = false;
    }
  }

  
  limpiarFormulario(): void {
    Object.assign(this, {
      cedula: '',
      regional: '',
      tipoJefe: '',
      tipoHora: '',
      proceso: '',
      justificacion: '',
      entregable: '',
      evidencia: '',
      usuarioAplicativo: '',
      fechaInicio: null,
      fechaFin: null,
      horaInicio: '',
      horaFin: '',
      regionalId: null,
      jefeId: null,
      procesoId: null,
      evidenciaId: null,
      horaId: null,
      mostrarRelojInicio: false,
      mostrarRelojFin: false,
      invalidFields: {},
      formErrors: [],
    });

    this.filteredOptions = [...this.options];
    this.filteredHoras = [...this.horas];
    this.filteredJefes = [...this.jefes];
    this.filteredEvidencias = [...this.evidencias];
    this.filteredProcesos = [...this.procesos];

    setTimeout(() => {
      document.querySelectorAll<HTMLInputElement>(
        '#cedula, #regional, #jefe, #tipoHora, #proceso, #justificacion, #evidencia, #entregable, #fechaInicio, #fechaFin, #horaInicio, #horaFin, #usuarioAplicativo'
      ).forEach((el) => (el.value = ''));
    }, 0);
  }

  onCancelar(): void {
    this.limpiarFormulario();
    this.router.navigate(['menu/tiempoRegistrado']);
  }
}