import { TestBed } from '@angular/core/testing';

import { TipoHoraService } from './tipo-hora.service';

describe('TipoHoraService', () => {
  let service: TipoHoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoHoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
