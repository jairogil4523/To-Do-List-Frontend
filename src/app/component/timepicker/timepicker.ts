import { Component, EventEmitter, Output, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timepicker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timepicker.html',
  styleUrls: ['./timepicker.css']
})
export class Timepicker {
  hour = 12;
  minute = 0;
  period: 'AM' | 'PM' = 'AM';

  // Mostrar horas en formato 12h: 1..12
  hours = Array.from({ length: 12 }, (_, i) => i + 1);
  // Mostrar minutos de 5 en 5: 0,5,10,...,55
  minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  mode: 'hour' | 'minute' = 'hour';

  @Output() timeSelected = new EventEmitter<string>();
  @Output() timePreview = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  private emitPreview() {
    const hourStr = (this.hour % 12 === 0 ? 12 : this.hour % 12).toString().padStart(2, '0');
    const preview = `${hourStr}:${this.minute.toString().padStart(2, '0')} ${this.period}`;
    this.timePreview.emit(preview);
  }

  getHourTransform(h: number) {
    // 12h: distribuye 12 valores en el círculo
    // Mapear 12 al tope (12 en el reloj), luego 1..11 alrededor.
    // Convertir la hora al índice 0..11 donde 12 -> 0
    const index = h % 12 === 0 ? 0 : h % 12;
    const angle = index * 30 - 90; // 360/12 = 30deg
    const radius = 90;
    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);
    return `translate(${x}px, ${y}px)`;
  }

  getMinuteTransform(m: number) {
    // 60 minutos: distribuye los 60 valores en el círculo
    // Mapea 0 minutos al tope del reloj. Usamos -90deg offset.
    const angle = m * 6 - 90;
    // Aumentado el radio para que la rueda de minutos sea más grande
    const radius = 100;
    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);
    return `translate(${x}px, ${y}px)`;
  }

  getHandTransform() {
    let value, angle;
    if (this.mode === 'hour') {
        // Normalizar la hora a un índice 12h (12 -> 0, 1 -> 1, ...)
      const index = this.hour % 12 === 0 ? 0 : this.hour % 12;
      value = index;
      angle = value * 30 - 90;
    } else {
      value = this.minute;
      angle = value * 6 - 90;
    }
  // Incluir translate para que el centro inferior del elemento quede en el centro del reloj
  // Aplicar un offset de 90° para alinear la dirección de la manecilla con los marcadores numéricos.
    const corrected = angle + 90;
    return `translate(-50%, -100%) rotate(${corrected}deg)`;
  }

  selectHour(h: number) {
    // h comes as 1..12
    this.hour = h % 12 === 0 ? 12 : h;
    // Keep mode on hour so the selected hour remains painted. If user wants
    // to select minutes they can click the minute display to switch mode.
    this.mode = 'hour';
    this.emitPreview();
    // After a short delay, switch to minute mode so the user can pick minutes.
    setTimeout(() => { this.mode = 'minute'; }, 160);
  }

  // Ajusta la longitud de la manecilla según el modo (más corta para minutos)
  getHandLength() {
    return this.mode === 'hour' ? 90 : 80;
  }

  selectMinute(m: number) {
    this.minute = m;
    // Keep in minute mode so the selected minute remains painted. Do not
    // close or auto-switch modes; user closes by selecting AM/PM.
    this.emitPreview();
  }

  confirm() {
    // Emitir en formato 12h con AM/PM
    const hourStr = (this.hour % 12 === 0 ? 12 : this.hour % 12).toString().padStart(2, '0');
    const time = `${hourStr}:${this.minute.toString().padStart(2, '0')} ${this.period}`;
    this.timeSelected.emit(time);
    this.closed.emit();
  }

  clear() {
    this.hour = 12;
    this.minute = 0;
    this.period = 'AM';
    this.mode = 'hour';
  }

  cancel() {
    this.closed.emit();
  }

  setPeriodAndClose(p: 'AM' | 'PM') {
    this.period = p;
    // Close after selecting the period
    this.emitPreview();
    this.closed.emit();
  }

  constructor(private host: ElementRef, private renderer: Renderer2) {}

  
  ngAfterViewInit(): void {
    try {
      const hostEl: HTMLElement = this.host.nativeElement as HTMLElement;
      if (hostEl && hostEl.classList && hostEl.classList.contains('open-left')) {
        const inner = hostEl.querySelector('.custom-timepicker') as HTMLElement;
        if (inner) {
          this.renderer.addClass(inner, 'open-left');
        }
      }
    } catch (e) {
      }
  }

}
