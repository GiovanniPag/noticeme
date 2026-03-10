import { Directive, AfterViewInit, ElementRef, NgZone, DestroyRef, inject, input, output, signal, effect } from '@angular/core';
import Grid, { GridOptions, Item } from 'muuri';

@Directive({
  selector: '[jhiGrid]',
  standalone: true,
})
export class MuuriGridDirective implements AfterViewInit {
  readonly config = input.required<GridOptions>();
  readonly gridCreated = output<Grid>();
  readonly grid = signal<Grid | null>(null);
  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    // defer one tick so children can render
    queueMicrotask(() => {
      this.createGrid(this.config());
    });

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
    this.grid()?.refreshItems().layout();
  }

  // ---- Internals ----
  private createGrid(cfg: GridOptions): void {
    if (this.grid()) return;
    this.zone.runOutsideAngular(() => {
      const grid = new Grid(this.elRef.nativeElement, cfg);
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
