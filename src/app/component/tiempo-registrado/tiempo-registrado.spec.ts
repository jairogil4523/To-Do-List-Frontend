import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiempoRegistrado } from './tiempo-registrado';

describe('TiempoRegistrado', () => {
  let component: TiempoRegistrado;
  let fixture: ComponentFixture<TiempoRegistrado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiempoRegistrado],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiempoRegistrado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
