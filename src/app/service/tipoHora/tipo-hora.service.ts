import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ITipoHora } from '../../model/tipoHora/tipoHora-model';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoHoraService {
  private apiUrl = environment.apiUrl + '/v1/tipohora';

  constructor(private http: HttpClient) { }

  getTipoHoras() {
    return this.http.get<ITipoHora[]>(`${this.apiUrl}/tipohora`);
  }


}

