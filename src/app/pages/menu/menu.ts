import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'; 
import { AuthService } from '../../service/auth/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../enviroments/environment';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, NgbDropdownModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css'],
})
// Control del sidebar móvil: `sidebarActive` y helpers para alternar/cerrar
export class Menu implements OnDestroy {
  sidebarActive = false;
  // rol del usuario y flags para la UI
  roles: any | null = null;
  // nombre del usuario para mostrar en el dropdown
  name: string | null = null;
  isovtcolaboradormp = false;
  isovtjefemp = false;
  isovtghmp = false;
  private sub: Subscription | null = null;
  powerBiUrl = environment.powerBiUrl;

  constructor(private authService: AuthService, private router: Router) {
    // suscribirse al usuario centralizado
    this.sub = this.authService.user$.subscribe((payload: any) => {
      this.updateFlagsFromPayload(payload);
    });
  }

  // Logout: limpiar localStorage, notificar al AuthService y navegar al login
  logout(): void {
    try {
      // limpiar todo el localStorage por petición explícita
      localStorage.clear();
    } catch (e) {
      // ignore
    }
    // notificar al servicio de auth que ya no hay usuario
    this.authService.clear();
    // navegar a la ruta raíz (login)
    this.router.navigate(['/']);
  }

  toggleSidebar(): void {
    this.sidebarActive = !this.sidebarActive;
  }

  closeSidebar(): void {
    this.sidebarActive = false;
  }

  private loadRoleFromStorage(): void {
    // ahora usamos el AuthService; este método queda por compatibilidad
    const raw = localStorage.getItem('auth');
    try {
      if (!raw) {
        this.roles = null;
        this.isovtcolaboradormp = false;
        this.isovtjefemp = false;
        this.isovtghmp = false;
        return;
      }
      const parsed: any = JSON.parse(raw);
      this.updateFlagsFromPayload(parsed);
    } catch (e) {
      this.roles = null;
      this.isovtcolaboradormp = false;
      this.isovtjefemp = false;
      this.isovtghmp = false;
    }
  }

  private updateFlagsFromPayload(parsed: any): void {
    // Normalizar payload y extraer roles: ahora el backend devuelve un array `roles`.
    const user = parsed?.user || parsed?.usuario || parsed;

    // Preferimos el array explícito `roles`, luego buscar en user, luego soportar campos antiguos
    const rawRoles = parsed?.roles || user?.roles || parsed?.rol || parsed?.role || user?.rol || user?.role || null;

    // Normalizar a array de cadenas en minúscula
    let normalizedRoles: string[] = [];
    if (Array.isArray(rawRoles)) {
      normalizedRoles = rawRoles.map((r: any) => (r || '').toString().toLowerCase());
    } else if (typeof rawRoles === 'string') {
      if (rawRoles.includes(',')) {
        normalizedRoles = rawRoles.split(',').map((r) => r.trim().toLowerCase());
      } else {
        normalizedRoles = [rawRoles.toLowerCase()];
      }
    } else if (rawRoles != null) {
      normalizedRoles = [rawRoles.toString().toLowerCase()];
    }

    // Guardar el valor original (puede ser array o string) para uso en template si se desea
    this.roles = rawRoles;

    // extraer nombre con varias claves posibles (nombre, name, username, nombreColaborador)
    const topName = parsed?.nombreColaborador || parsed?.name || parsed?.username;
    const userNameColaborador = user?.nombre || user?.name || user?.username || user?.usuario;
    this.name = topName || userNameColaborador || null;

    // Definir códigos conocidos para mapear a categorías
  const JEFE_CODES = ['ovtjefemp', 'ovtjefe'];
  const ADMIN_CODES = ['ovtghmp', 'ovtghcm'];
    const COLAB_CODES = ['ovtcolaboradormp', 'ovtcolaborador'];

    const hasCode = (codes: string[]) => codes.some((c) => normalizedRoles.includes(c));
    const hasText = (substr: string) => normalizedRoles.some((r) => r.includes(substr));

  // Setear flags combinando códigos y heurísticas textuales para compatibilidad
  // Nota: ADMIN_CODES no debe activar el flag de jefe
  this.isovtcolaboradormp = hasCode(COLAB_CODES) || hasText('colaborador') || normalizedRoles.includes('user') || normalizedRoles.includes('empleado');
  this.isovtjefemp = hasCode(JEFE_CODES) || hasText('jefe') || hasText('manager') || hasText('jef') ;
  this.isovtghmp = hasCode(ADMIN_CODES) || normalizedRoles.some((r) => r.includes('gh')) || hasText('jefe gh');
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }
}
