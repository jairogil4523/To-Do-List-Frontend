import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRegonales } from '../../model/regionales/reginales-model/reginales-model';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegonalesService {
  private baseUrl = environment.apiUrl + '/v1/regionales';

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<IRegonales[]>(`${this.baseUrl}/getAll`);
  }
  
}
