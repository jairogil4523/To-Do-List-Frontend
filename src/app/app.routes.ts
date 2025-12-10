import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Menu } from './pages/menu/menu';
import { TiempoRegistrado } from './component/tiempo-registrado/tiempo-registrado';
import { RegistrarTiempo } from './component/registrar-tiempo/registrar-tiempo';
import { SolicitudPendiente } from './component/solicitud-pendientes/solicitud-pendiente';
import { SolicitudPendienteGh } from './component/solicitudes-pendientes-gh/solicitud-pendiente-gh';
import { SolicitudProcesadas } from './component/solicitud-procesadas/solicitud-procesadas';
import { DevolverSolicitudes } from './component/devolver-solicitudes/devolver-solicitudes';
import { DevolverSolicitudesNacional } from './component/devolver-solicitudes-nacional/devolver-solicitudes-nacional';
import { SolicitudPendienteGhNacional } from './component/solucitudes-gh-nacional/solicitud-pendiente-gh-nacional';
import { Reportes } from './component/reportes/reportes';
import { Tablero } from './component/tablero/tablero';

export const routes: Routes = [
  { path: '', component: Login },
  {
    path: 'menu',
    component: Menu,
    children: [
      { path: 'tiemposRegistrados', component: TiempoRegistrado },
      { path: 'tiempoRegistrado', component: TiempoRegistrado },
      { path: 'registrarTiempo', component: RegistrarTiempo },
      { path: 'solicitudPendiente', component: SolicitudPendiente },
      { path: 'solicitudProcesadas', component: SolicitudProcesadas },
      { path: 'solicitudPendienteGh', component: SolicitudPendienteGh },
      { path: 'devolverSolicitudes', component: DevolverSolicitudes },
      { path: 'solicitudPendienteGhNacional', component: SolicitudPendienteGhNacional },
      { path: 'devolverSolicitudesNacional', component: DevolverSolicitudesNacional },
      { path: 'reportes', component: Reportes},
      { path: 'tablero', component: Tablero }
    ],
  },
];
