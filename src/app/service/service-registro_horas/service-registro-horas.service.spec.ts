import { TestBed } from '@angular/core/testing';

import { ServiceRegistroHoras } from './service-registro-horas.service';

describe('ServiceRegistroHoras', () => {
  let service: ServiceRegistroHoras;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceRegistroHoras);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
