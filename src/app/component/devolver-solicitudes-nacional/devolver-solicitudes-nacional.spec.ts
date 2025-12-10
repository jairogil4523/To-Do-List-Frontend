import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevolverSolicitudesNacional } from './devolver-solicitudes-nacional';

describe('DevolverSolicitudesNacional', () => {
  let component: DevolverSolicitudesNacional;
  let fixture: ComponentFixture<DevolverSolicitudesNacional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevolverSolicitudesNacional],
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevolverSolicitudesNacional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
