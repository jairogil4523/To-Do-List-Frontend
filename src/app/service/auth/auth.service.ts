import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ServiceRegistroHoras } from '../service-registro_horas/service-registro-horas.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'auth';
  private subject = new BehaviorSubject<any>(this.loadFromStorage());
  // Exponer la suma de horas del mes actual para el usuario autenticado
  private horasMesSubject = new BehaviorSubject<number | null>(null);
  horasMes$ = this.horasMesSubject.asObservable();
  private _fetchSub: Subscription | null = null;

  // Observable público con el objeto almacenado (puede ser null)
  user$ = this.subject.asObservable();

  constructor(private registroService: ServiceRegistroHoras) {
    // Si hay una sesión guardada en localStorage al iniciar la aplicación,
    // intentar recuperar la suma de horas del mes para ese usuario.
    const uid = this.getUserId();
    if (uid) {
      this.registroService.getHorasMesActual(uid).subscribe({
        next: (v) => this.horasMesSubject.next(v),
        error: () => this.horasMesSubject.next(null),
      });
    }
  }

  setAuth(payload: any): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
    this.subject.next(payload);

    // Al autenticar, solicitar la suma de horas del mes para ese usuario
    const uid = this.getUserId();
    this._fetchSub?.unsubscribe();
    if (uid) {
      this._fetchSub = this.registroService.getHorasMesActual(uid).subscribe({
        next: (v) => this.horasMesSubject.next(v),
        error: () => this.horasMesSubject.next(null),
      });
    } else {
      this.horasMesSubject.next(null);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      // ignore
    }
    this.subject.next(null);
    this._fetchSub?.unsubscribe();
    this.horasMesSubject.next(null);
  }

  getRole(): string | null {
    const raw = this.subject.value ?? this.loadFromStorage();
    if (!raw) return null;
    // El rol puede venir en el nivel superior: { rol: '...' }
    const topRol = raw?.rol || raw?.role;
    if (topRol) return topRol;
    const roles = this.getRoles();
    if (roles && roles.length) return roles[0];
    const user = this.getUserObject(raw);
    return user?.rol || user?.role || null;
  }

  /**
   * Devuelve el array de roles si está presente en la respuesta (ej: { roles: [...] })
   */
  getRoles(): string[] {
    const raw = this.subject.value ?? this.loadFromStorage();
    if (!raw) return [];
    const roles = raw?.roles || raw?.roles || [];
    if (Array.isArray(roles)) return roles.map((r: any) => (r || '').toString());
    // Si viene como string separada por comas
    if (typeof roles === 'string') return roles.split(',').map((r) => r.trim());
    return [];
  }

  getNombreColaborador(): string | null {
    const raw = this.subject.value ?? this.loadFromStorage();
    if (!raw) return null;
    return raw?.nombreColaborador || raw?.nombre || null;
  }

  getUserId(): string | null {
    const raw = this.subject.value ?? this.loadFromStorage();
    if (!raw) return null;
    const user = this.getUserObject(raw);
    return raw?.usuario ?? raw?.id ?? raw?.usuarioId ?? raw?.idColaborador ?? raw?.identificacion ?? raw?.identificador ?? 
           user?.usuario ?? user?.id ?? user?.usuarioId ?? user?.idColaborador ?? user?.identificacion ?? user?.identificador ?? null;
  }

  private loadFromStorage(): any {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  private getUserObject(raw: any): any {
    if (!raw) return null;
    return raw.user || raw.usuario || raw;
  }
}
