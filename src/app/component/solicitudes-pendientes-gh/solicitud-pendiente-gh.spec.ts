import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudPendienteGh } from './solicitud-pendiente-gh';

describe('SolicitudPendienteGh', () => {
  let component: SolicitudPendienteGh;
  let fixture: ComponentFixture<SolicitudPendienteGh>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudPendienteGh],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudPendienteGh);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
