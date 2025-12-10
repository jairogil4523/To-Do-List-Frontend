import { TestBed } from '@angular/core/testing';

import { RegonalesService } from './reginales.service';

describe('RegonalesService', () => {
  let service: RegonalesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegonalesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
