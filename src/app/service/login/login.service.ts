import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ILogin } from '../../model/login/login-model';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl + '/v1/auth/login';

  constructor(private http: HttpClient) {}
  login(credentials: ILogin) {
    // El backend ahora devuelve un objeto con usuario, roles, nombreColaborador y menú.
    // Usamos `any` para mayor flexibilidad y dejamos el parseo a AuthService / Login component.
    return this.http.post<any>(this.apiUrl, credentials);
  }
}
