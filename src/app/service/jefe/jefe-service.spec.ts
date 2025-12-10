import { TestBed } from '@angular/core/testing';

import { JefeService } from './jefe.service';

describe('JefeService', () => {
  let service: JefeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JefeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
