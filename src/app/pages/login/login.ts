import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LoginService } from '../../service/login/login.service';
import { AuthService } from '../../service/auth/auth.service';
import { ILogin } from '../../model/login/login-model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal } from '../../component/shared/confirm-modal/confirm-modal';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form: FormGroup;

  loading = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private loginService: LoginService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  private _horasSub: Subscription | null = null;

  ingresar() {
    this.errorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const credentials: ILogin = {
      username: (this.form.get('username')?.value as string) || '',
      password: (this.form.get('password')?.value as string) || '',
    };

    this.loginService.login(credentials).subscribe({
      next: (res: any) => {
        // Store whole response using AuthService (centralizado)
        this.authService.setAuth(res);

        this.loading = false;

        // Decidir ruta objetivo pero esperar la comprobación de horas antes de navegar
        const roleRaw = this.authService.getRole() || res?.rol || res?.role || res?.usuario?.rol || res?.user?.rol || '';
        const roleStr = (roleRaw || '').toString().toLowerCase();
        const targetRoute = (roleStr.includes('jefe inmediato') || roleStr.includes('jefe') || roleStr.includes('admin') || roleStr.includes('manager'))
          ? ['/menu/solicitudPendiente']
          : ['/menu/tiemposRegistrados'];

        // Esperar la primera emisión numérica de horasMes$ (o null) y luego actuar.
        let navigated = false;

        this._horasSub?.unsubscribe();
        this._horasSub = this.authService.horasMes$.subscribe((h) => {
          if (typeof h === 'number') {
            // Si supera 40, mostrar modal de aviso
            if (h > 40) {
              const ref = this.dialog.open(ConfirmModal, {
                data: {
                  title: 'Atención',
                  message: `Ha reportadas en el mes: ${h.toFixed(2)}. Ya esta a punto de superar el límite horas extras.`,
                  confirmText: 'Aceptar',
                  cancelText: 'Cerrar'
                },
                disableClose: false,
                panelClass: 'custom-confirm-dialog'
              });

              ref.afterClosed().subscribe(() => {
                if (!navigated) {
                  navigated = true;
                  this.router.navigate(targetRoute);
                }
              });
            } else {
              if (!navigated) {
                navigated = true;
                this.router.navigate(targetRoute);
              }
            }

            // una vez recibido el número, cancelar la suscripción
            this._horasSub?.unsubscribe();
            this._horasSub = null;
          }
        });

        // Fallback: si no recibimos un valor numérico en 1500ms, navegar de todos modos
        setTimeout(() => {
          if (!navigated) {
            navigated = true;
            this._horasSub?.unsubscribe();
            this._horasSub = null;
            this.router.navigate(targetRoute);
          }
        }, 1500);
      },
      error: (err: any) => {
        this.loading = false;
        // Mejor manejo de errores: extraer status, url y cuerpo
        const status = err?.status;
        const url = err?.url || err?.error?.url || '';

        // Si el servidor devuelve 401 o 403, mostrar mensaje específico de credenciales incorrectas
        // También, si ocurre un 5xx específicamente al endpoint de login asumimos fallo de autenticación
        const isLoginEndpointError = typeof url === 'string' && url.includes('/auth/login');
        if (status === 401 || status === 403 || (status >= 500 && isLoginEndpointError)) {
          this.errorMessage = 'El usuario o la contraseña no son correcta. Compruébala.';

          return;
        }

        // Intentar extraer mensaje del backend de varias formas
        let backendMsg: string | null = null;
        try {
          if (err && err.error) {
            if (typeof err.error === 'string') {
              backendMsg = err.error;
            } else if (err.error.message || err.error.msg) {
              backendMsg = err.error.message || err.error.msg;
            } else if (typeof err.error === 'object') {
              // Intentar convertir a string si es posible
              backendMsg = JSON.stringify(err.error);
            }
          }
        } catch (e) {
          // ignore parse errors
        }

        if (backendMsg) {
          // Mostrar mensaje del backend (si parece legible)
          // Si es JSON con keys internas, aún así lo mostramos porque puede contener info útil
          this.errorMessage = backendMsg;

          return;
        }

        // Fallback genérico (incluye el mensaje que Angular construye como 'Http failure response...')
        this.errorMessage = 'Error al iniciar sesión';

      },
    });
  }
}
