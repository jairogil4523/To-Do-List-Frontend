import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrarTiempo } from './registrar-tiempo';

describe('RegistrarTiempo', () => {
  let component: RegistrarTiempo;
  let fixture: ComponentFixture<RegistrarTiempo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarTiempo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarTiempo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
