import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevolverSolicitudes } from './devolver-solicitudes';

describe('DevolverSolicitudes', () => {
  let component: DevolverSolicitudes;
  let fixture: ComponentFixture<DevolverSolicitudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevolverSolicitudes],
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevolverSolicitudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
