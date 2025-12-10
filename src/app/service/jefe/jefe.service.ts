import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IJefe } from '../../model/jefe/jefe/jefe-model';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root',
})
export class JefeService {
  // Use base endpoint and build specific paths dynamically to avoid sending placeholders
  private apiUrl = environment.apiUrl + '/v1/auth/jefes';

  constructor(private http: HttpClient) {}
  /**
   * Obtiene jefes.
   * Si se pasan `rol` y `regionalId` llama a /v1/auth/jefes/rol/{rol}/regional/{regionalId}
   * Si sólo se pasa `regionalId` llama a /v1/auth/jefes/regional/{regionalId}
   * Si no se pasan parámetros devuelve la lista general en /v1/auth/jefes
   */
  getJefes(roles?: string, regionalId?: number) {
    if (roles && regionalId != null) {
      const rolEscaped = encodeURIComponent(roles);
      return this.http.get<IJefe[]>(`${this.apiUrl}/rol/${rolEscaped}/regional/${regionalId}`);
    }

    if (regionalId != null) {
      return this.http.get<IJefe[]>(`${this.apiUrl}/regional/${regionalId}`);
    }

    return this.http.get<IJefe[]>(`${this.apiUrl}`);
  }
}
