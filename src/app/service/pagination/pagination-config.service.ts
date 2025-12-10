import { Injectable } from '@angular/core';
import { PaginationConfig } from '../../model/pagination/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class PaginationConfigService {
  
  private defaultConfig: PaginationConfig = {
    pageSizeOptions: [5, 10, 25, 50, 100],
    defaultPageSize: 10,
    showFirstLastButtons: true
  };

  getDefaultConfig(): PaginationConfig {
    return { ...this.defaultConfig };
  }

  getCustomConfig(overrides: Partial<PaginationConfig>): PaginationConfig {
    return { ...this.defaultConfig, ...overrides };
  }

  setDefaultPageSize(size: number): void {
    this.defaultConfig.defaultPageSize = size;
  }

  setDefaultPageSizeOptions(options: number[]): void {
    this.defaultConfig.pageSizeOptions = options;
  }
}