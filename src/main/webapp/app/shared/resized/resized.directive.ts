import { Directive, DestroyRef, ElementRef, NgZone, inject, output } from '@angular/core';
import { ResizedEvent, createResizedEvent } from './resized.event';

@Directive({
  selector: '[jhiResized]',
  standalone: true,
})
export class ResizedDirective {
  readonly resized = output<ResizedEvent>();
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private observer: ResizeObserver;
  private oldRect?: DOMRectReadOnly;

  constructor() {
    this.observer = new ResizeObserver(entries => {
      const entry = entries[0];
      const newRect = entry.contentRect;
      const event: ResizedEvent = createResizedEvent(newRect, this.oldRect);
      this.oldRect = newRect;
      // Emit inside Angular
      this.zone.run(() => this.resized.emit(event));
    });
    // Start observing outside Angular
    this.zone.runOutsideAngular(() => {
      this.observer.observe(this.el.nativeElement);
    });
    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.observer.disconnect();
    });
  }
}
