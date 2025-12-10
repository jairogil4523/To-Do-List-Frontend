import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ITiempoRegistrado } from '../../model/tiempoRegistrado/tiempo-registrado.model';
import { environment } from '../../../enviroments/environment';


@Injectable({ providedIn: 'root' })
export class ServiceRegistroHoras {
  private baseUrl = environment.apiUrl + '/v1/tiemporegistrado';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ITiempoRegistrado[]> {
    // GET: recupera los registros. El array debe contener campos como
    // `cantidadHoras`, `fechaHoraInicio`, `fechaHoraFin`, `estadoJefe`, etc.
    return this.http.get<ITiempoRegistrado[]>(`${this.baseUrl}/registrado`);
  }

  /**
   * Calcula la suma de `cantidadHoras` de los registros del mes actual.
   * Si se pasa `idColaborador`, filtra por ese colaborador.
   */
  getHorasMesActual(idColaborador?: string): Observable<number> {
    return this.getAll().pipe(
      map((list: ITiempoRegistrado[]) => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        return list
          .filter((r) => {
            if (!r || r.eliminado) return false;

            // obtener fecha desde posibles formatos
            const rawFecha = (r as any).fechaHoraInicio ?? (r as any).fechainicio ?? (r as any).fecha_inicio;
            const fecha = rawFecha ? new Date(rawFecha as any) : null;
            if (!fecha || isNaN(fecha.getTime())) return false;

            const sameMonth = fecha.getMonth() === month && fecha.getFullYear() === year;

            if (!idColaborador) return sameMonth;

            // comparar id de colaborador con varias posibles claves que el backend pueda devolver
            const anyCur: any = r as any;
            const colaboradorVals = [
              anyCur.idColaborador,
              anyCur.idcolaborador,
              anyCur.colaboradorid,
              anyCur.colaboradorId,
              anyCur.usuario,
              anyCur.usuario_red,
              anyCur.usuarioRed,
              anyCur.documento,
            ]
              .filter((v) => v !== undefined && v !== null)
              .map((v) => String(v));

            return sameMonth && (colaboradorVals.length === 0 ? false : colaboradorVals.includes(String(idColaborador)));
          })
          .reduce((acc, cur) => {
            // soporte para diferentes nombres de columna que pueda devolver el backend
            const anyCur: any = cur as any;
            const val = Number(
              anyCur.cantidadHoras ?? anyCur.cantidad_horas ?? anyCur.cantidadHora ?? anyCur['cantidad de hora'] ?? anyCur.cantidad ?? 0
            );
            return acc + (isNaN(val) ? 0 : val);
          }, 0);
      })
    );
  }

  getPendientes(): Observable<ITiempoRegistrado[]> {
    // GET: recupera solo las solicitudes pendientes
    return this.http.get<ITiempoRegistrado[]>(`${this.baseUrl}/pendientes`);
  }

  create(data: ITiempoRegistrado): Observable<ITiempoRegistrado> {
    // POST: crea un nuevo registro. Se espera recibir en `data` campos
    // como `cantidadHoras` (número), y las fechas/horas por separado si el
    // backend lo requiere (el cliente ya envía `fechainicio`/`horainicio`, etc.).
    return this.http.post<ITiempoRegistrado>(`${this.baseUrl}/create`, data);
  }

  update(id: number, data: ITiempoRegistrado): Observable<ITiempoRegistrado> {
    return this.http.put<ITiempoRegistrado>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number, date: ITiempoRegistrado): Observable<ITiempoRegistrado> {
    return this.http.put<ITiempoRegistrado>(`${this.baseUrl}/delete/${id}`, date);
  }
}
