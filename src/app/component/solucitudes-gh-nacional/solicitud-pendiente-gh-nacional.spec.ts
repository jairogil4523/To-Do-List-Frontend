import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudPendienteGhNacional } from './solicitud-pendiente-gh-nacional';

describe('SolicitudPendienteGhNacional', () => {
  let component: SolicitudPendienteGhNacional;
  let fixture: ComponentFixture<SolicitudPendienteGhNacional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudPendienteGhNacional],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudPendienteGhNacional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
