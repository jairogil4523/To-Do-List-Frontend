import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import { IReporte } from '../../model/Reporte/reporte_model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = environment.apiUrl + '/v1/reporte';

  constructor(private http: HttpClient) { }

  getTiempo(regional?: string, jefe?: string, fechaInicio?: string, fechaFin?: string) {
    const regionalParam = regional || 'ALL';
    const jefeParam = jefe || 'ALL';
    const fechaInicioParam = fechaInicio || '';
    const fechaFinParam = fechaFin || '';
    
    const url = `${this.apiUrl}/tiempo/${regionalParam}/${jefeParam}/${fechaInicioParam}/${fechaFinParam}`;
    return this.http.get<IReporte[]>(url);
  }

  getBitacora(regional?: string, jefe?: string, fechaInicio?: string, fechaFin?: string) {
    const regionalParam = regional || 'ALL';
    const jefeParam = jefe || 'ALL';
    const fechaInicioParam = fechaInicio || '';
    const fechaFinParam = fechaFin || '';
    
    const url = `${this.apiUrl}/bitacora/${regionalParam}/${jefeParam}/${fechaInicioParam}/${fechaFinParam}`;
    return this.http.get<IReporte[]>(url);
  }

  getDescargarTiempo(regional?: string, jefe?: string, fechaInicio?: string, fechaFin?: string) {
    const regionalParam = regional || 'ALL';
    const jefeParam = jefe || 'ALL';
    const fechaInicioParam = fechaInicio || '';
    const fechaFinParam = fechaFin || '';
    
    const url = `${this.apiUrl}/download/tiempo/${regionalParam}/${jefeParam}/${fechaInicioParam}/${fechaFinParam}`;
    return this.http.get(url, { responseType: 'blob' });
  }

 getDescargarBitacora(regional?: string, jefe?: string, fechaInicio?: string, fechaFin?: string) {
    const regionalParam = regional || 'ALL';
    const jefeParam = jefe || 'ALL';
    const fechaInicioParam = fechaInicio || '';
    const fechaFinParam = fechaFin || '';
    
    const url = `${this.apiUrl}/download/estados/${regionalParam}/${jefeParam}/${fechaInicioParam}/${fechaFinParam}`;
    return this.http.get(url, { responseType: 'blob' });
  }




}

