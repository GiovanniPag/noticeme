import { Directive, ElementRef, DestroyRef, inject, output, effect } from '@angular/core';
import { Item } from 'muuri';
import { MuuriGridDirective } from './muuri-grid.directive';

@Directive({
  selector: '[jhiGridItem]',
  standalone: true,
})
export class MuuriGridItemDirective {
  readonly itemCreated = output<Item>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gridDir = inject(MuuriGridDirective, { host: true });

  constructor() {
    effect(() => {
      const grid = this.gridDir.grid(); // track grid signal
      if (!grid) return;
      const el = this.elRef.nativeElement;
      // Prevent duplicate registration
      const existing = grid.getItem(el);
      if (existing) return;
      const items = this.gridDir.addItem(this.elRef);
      if (items.length) this.itemCreated.emit(items[0]);
      this.gridDir.refresh();
    });
    this.destroyRef.onDestroy(() => {
      // grid may already be destroyed; removeItem handles it safely
      this.gridDir.removeItem(this.elRef);
    });
  }
}
