import { Directive, ElementRef, DestroyRef, inject, output, effect } from '@angular/core';
import { Item } from 'muuri';
import { MuuriGridDirective } from './muuri-grid.directive';

@Directive({
  selector: '[jhiGridItem]',
  standalone: true,
})
export class MuuriGridItemDirective {
  readonly itemCreated = output<Item>();
  private registered = false;
  private readonly destroyRef = inject(DestroyRef);
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gridDir = inject(MuuriGridDirective, { host: true });

  constructor() {
    effect(() => {
      const grid = this.gridDir.grid(); // track grid signal
      if (!grid) return;
      // If grid rebuilds, we need to register again.
      if (!this.registered) {
        const items = this.gridDir.addItem(this.elRef);
        if (items.length) this.itemCreated.emit(items[0]);
        // Force refresh/layout to prevent overlaps
        this.gridDir.refresh();
        this.registered = true;
        // On destroy, remove item from grid (best effort)
        this.destroyRef.onDestroy(() => {
          // grid may already be destroyed; removeItem handles it safely
          this.gridDir.removeItem(this.elRef);
        });
      }
    });
    // If the grid gets destroyed & recreated, we want to allow re-registering.
    effect(() => {
      const grid = this.gridDir.grid();
      if (!grid) {
        // grid destroyed => allow re-registering when it comes back
        this.registered = false;
      }
    });
  }
}
