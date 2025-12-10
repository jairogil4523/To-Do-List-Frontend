import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import { IEstado } from '../../model/estado/estado-model';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EstadoService {
  // base template for the tiemporegistrado endpoint; placeholders are replaced per-call
  private apiUrl = environment.apiUrl + '/v1/tiemporegistrado/colaborador/{idcolaborador}/rol/{rol}';

  constructor(private http: HttpClient) {}
  login(credentials: IEstado) {
    // legacy method: kept for compatibility but it posts to the template URL
    // (callers should prefer postEstado with explicit idColaborador and rol)
    return this.http.post<IEstado>(this.apiUrl, credentials);
  }

  /**
   * Post an IEstado payload for a specific collaborator id and role.
   * idColaborador: user identifier from login
   * rol: role value from login
   */
  
  /**
   * GET estados for collaborator and role. Optionally pass an array of registro ids
   * that will be sent as a comma-separated `ids` query parameter.
   */
  getEstados(idColaborador: string | number, rol: string, ids?: Array<string | number>) {
    let url = this.apiUrl
      .replace('{idcolaborador}', encodeURIComponent(String(idColaborador)))
      .replace('{rol}', encodeURIComponent(String(rol)));
    if (ids && ids.length) {
      const q = ids.map((i) => encodeURIComponent(String(i))).join(',');
      url += `?ids=${q}`;
    }
    return this.http.get<any>(url);
  }

  // Helper to update a estado by id. Mirrors ServiceRegistroHoras.update
  updateEstado(id: string | number, data: any) {
    // Use the tiemporegistrado resource path so the endpoint becomes
    // <API_ROOT>/tiemporegistrado/{id}
    const url = environment.apiUrl + `/v1/estados/${id}`;
    const headers = { 'Content-Type': 'application/json' };
    return this.getEstado(id).pipe(
      take(1),
      map((result: any) => {
        const updated = { ...result, ...data };
        // No forzar un valor por defecto aquí: respetar lo que envía el componente
        return updated;
      }),
      switchMap((estado) => this.http.put<any>(url, estado, { headers }))
    );
  }

  // Helper to perform delete action (soft-delete) for a estado by id.
  deleteEstado(id: number | string, data: any) {
    // Keep using PUT for soft-delete but target the tiemporegistrado resource so
    // endpoints are consistent with updateEstado.
    const url = environment.apiUrl + `/tiemporegistrado/${id}`;
    const headers = { 'Content-Type': 'application/json' };
    return this.http.put<any>(url, data, { headers });
  }

  // GET pendientes: similar to ServiceRegistroHoras.getPendientes
  getPendientes() {
    const url = environment.apiUrl + '/v1/tiemporegistrado/pendientes';
    return this.http.get<any>(url);
  }

  getEstado(idestado: string | number) {
    const url = environment.apiUrl + `/v1/estados/${idestado}`;
    return this.http.get<any>(url);
  }
}
