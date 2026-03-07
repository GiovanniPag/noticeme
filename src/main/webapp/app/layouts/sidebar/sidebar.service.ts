import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SideBarService {
  // Expose readonly signal
  private readonly _isActive = signal(false);
  readonly isActive = this._isActive.asReadonly();

  closeSidebar(): void {
    this._isActive.set(false);
  }

  toggleSidebar(): void {
    this._isActive.update(value => !value);
  }

  open(): void {
    this._isActive.set(true);
  }
}
