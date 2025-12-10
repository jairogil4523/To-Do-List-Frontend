import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IGestion } from '../../model/gestion/gestion-model';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class GestionService {
  private apiUrl = environment.apiUrl + '/v1/gestion';

  constructor(private http: HttpClient) { }

  getGestion() {
    return this.http.get<IGestion[]>(`${this.apiUrl}/gestion`);
  }


}

