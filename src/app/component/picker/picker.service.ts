import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type PickerName = 'inicio' | 'fin' | null;

@Injectable({ providedIn: 'root' })
export class PickerService {
  private _current: PickerName = null;
  private _clear$ = new Subject<void>();
  private _ok$ = new Subject<void>();
  private _cancel$ = new Subject<void>();

  set current(p: PickerName) {
    this._current = p;
  }

  get current(): PickerName {
    return this._current;
  }

  requestClear() {
    this._clear$.next();
  }

  requestOk() {
    this._ok$.next();
  }

  requestCancel() {
    this._cancel$.next();
  }

  onClear() {
    return this._clear$.asObservable();
  }

  onOk() {
    return this._ok$.asObservable();
  }

  onCancel() {
    return this._cancel$.asObservable();
  }
}
