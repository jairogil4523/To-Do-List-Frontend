import { TestBed } from '@angular/core/testing';

import { ProcesoService } from './proceso.service';

describe('ProcesoService', () => {
  let service: ProcesoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcesoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
