import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PaginationRequest, PaginationResponse } from '../../model/pagination/pagination.model';
import { PaginationService } from './pagination.service';

@Injectable()
export abstract class BasePaginatedService<T> {
  protected paginationSubject = new BehaviorSubject<PaginationResponse<T> | null>(null);
  public pagination$ = this.paginationSubject.asObservable();

  protected currentRequest: PaginationRequest = {
    page: 0,
    size: 10
  };

  constructor(protected paginationService: PaginationService) {}

  abstract getBaseUrl(): string;

  loadPage(request: PaginationRequest): Observable<PaginationResponse<T>> {
    this.currentRequest = { ...request };
    const result = this.paginationService.getPaginatedData<T>(this.getBaseUrl(), request);
    result.subscribe(data => this.paginationSubject.next(data));
    return result;
  }

  getCurrentRequest(): PaginationRequest {
    return { ...this.currentRequest };
  }

  refresh(): Observable<PaginationResponse<T>> {
    return this.loadPage(this.currentRequest);
  }
}