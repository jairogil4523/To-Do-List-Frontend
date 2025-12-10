import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudPendiente } from './solicitud-pendiente';

describe('SolicitudPendiente', () => {
  let component: SolicitudPendiente;
  let fixture: ComponentFixture<SolicitudPendiente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudPendiente],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudPendiente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
