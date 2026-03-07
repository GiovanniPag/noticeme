import { Directive, ElementRef, NgZone, DestroyRef, inject, input, output, signal, effect } from '@angular/core';
import Grid, { GridOptions, Item } from 'muuri';

@Directive({
  selector: '[jhiGrid]',
  standalone: true,
})
export class MuuriGridDirective {
  readonly config = input.required<GridOptions>();
  readonly gridCreated = output<Grid>();
  readonly grid = signal<Grid | null>(null);
  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // React to config changes (signal-based)
    effect(() => {
      const cfg = this.config();
      this.destroyGrid();
      this.createGrid(cfg);
    });
    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.destroyGrid();
    });
  }

  // ---- Public API used by muuriGridItem directive ----
  addItem(itemElRef: ElementRef<HTMLElement>): Item[] {
    const grid = this.grid();
    if (!grid) return [];
    const el = itemElRef.nativeElement;
    if (grid.getItem(el)) {
      return [];
    }
    return grid.add(el);
  }

  removeItem(itemElRef: ElementRef): void {
    const grid = this.grid();
    if (!grid) return;
    const el = itemElRef.nativeElement;
    const item = grid.getItem(el);
    if (!item) return;
    grid.remove([item], { layout: true });
  }

  refresh(): void {
    this.grid()?.refreshItems();
  }

  // ---- Internals ----
  private createGrid(cfg: GridOptions): void {
    this.zone.runOutsideAngular(() => {
      const host = this.elRef.nativeElement;
      const grid = new Grid(host, cfg);
      // store + emit inside Angular
      this.zone.run(() => {
        this.grid.set(grid);
        this.gridCreated.emit(grid);
      });
    });
  }

  private destroyGrid(): void {
    const grid = this.grid();
    if (!grid) return;
    try {
      grid.destroy();
    } finally {
      this.grid.set(null);
    }
  }
}
