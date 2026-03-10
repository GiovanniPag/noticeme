import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SideBarService {
  // Expose readonly signal
  readonly isActive = this._isActive.asReadonly();
  private readonly _isActive = signal(false);

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
