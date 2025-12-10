import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginationRequest, PaginationResponse } from '../../model/pagination/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {

  constructor(private http: HttpClient) { }

  buildHttpParams(request: PaginationRequest): HttpParams {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('size', request.size.toString());

    if (request.sort) {
      const sortParam = request.direction ? `${request.sort},${request.direction}` : request.sort;
      params = params.set('sort', sortParam);
    }

    return params;
  }

  getPaginatedData<T>(url: string, request: PaginationRequest): Observable<PaginationResponse<T>> {
    const params = this.buildHttpParams(request);
    return this.http.get<PaginationResponse<T>>(url, { params });
  }
}