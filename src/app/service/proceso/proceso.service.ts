import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IProceso } from '../../model/proceso/proceso-model';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcesoService {
  private apiUrl = environment.apiUrl + '/v1/procesos';

  constructor(private http: HttpClient) { }

  getProcesos() {
    return this.http.get<IProceso[]>(`${this.apiUrl}/proceso`);
  }


}

