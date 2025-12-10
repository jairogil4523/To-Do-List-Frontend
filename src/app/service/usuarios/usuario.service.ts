import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUsuario } from '../../model/usuarios/usuario.model';
import { environment } from '../../../enviroments/environment';
import { BasePaginatedService } from '../pagination/base-paginated.service';
import { PaginationService } from '../pagination/pagination.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService extends BasePaginatedService<IUsuario> {
  private baseUrl = environment.apiUrl + '/v1/usuarios';

  constructor(private http: HttpClient, paginationService: PaginationService) {
    super(paginationService);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getId(id: number) {
    return this.http.get<IUsuario>(`${this.baseUrl}/${id}`);
  }
}
