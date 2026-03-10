import { Directive, AfterViewInit, ElementRef, DestroyRef, inject, output, effect } from '@angular/core';
import { Item } from 'muuri';
import { MuuriGridDirective } from './muuri-grid.directive';

@Directive({
  selector: '[jhiGridItem]',
  standalone: true,
})
export class MuuriGridItemDirective implements AfterViewInit {
  readonly itemCreated = output<Item>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gridDir = inject(MuuriGridDirective, { host: true });

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      const grid = this.gridDir.grid();
      if (!grid) return;

      const existing = grid.getItem(this.elRef.nativeElement);
      if (existing) return;

      const items = this.gridDir.addItem(this.elRef);
      if (items.length) {
        this.itemCreated.emit(items[0]);
        this.gridDir.refresh();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.gridDir.removeItem(this.elRef);
    });
  }
}
