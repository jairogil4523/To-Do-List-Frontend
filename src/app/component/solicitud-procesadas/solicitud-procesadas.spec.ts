import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudProcesadas } from './solicitud-procesadas';

describe('SolicitudProcesadas', () => {
  let component: SolicitudProcesadas;
  let fixture: ComponentFixture<SolicitudProcesadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudProcesadas],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudProcesadas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
