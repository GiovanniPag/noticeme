import { Directive, DestroyRef, ElementRef, NgZone, effect, inject, input, output, signal } from '@angular/core';

type DomEventName = keyof DocumentEventMap | (string & {});

@Directive({
  selector: '[jhiClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  // -----------------------
  // Inputs
  // -----------------------
  readonly clickOutsideEnabled = input<boolean>(true);
  readonly attachOutsideOnClick = input<boolean>(false);
  readonly delayClickOutsideInit = input<boolean>(false);
  readonly emitOnBlur = input<boolean>(false);
  readonly exclude = input<string>('');
  readonly excludeBeforeClick = input<boolean>(false);
  /** Comma-separated event names. Default is "click". */
  readonly clickOutsideEvents = input<string>('');
  // -----------------------
  // Output (signal output)
  // -----------------------
  readonly clickOutside = output<Event>();
  // -----------------------
  // Internal state
  // -----------------------
  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly excludedNodes = signal<HTMLElement[]>([]);
  // Listener bookkeeping
  private docEventsAttached: DomEventName[] = [];
  private hostInitEventsAttached: DomEventName[] = [];
  private blurAttached = false;
  private delayTimerId: number | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.detachAll();
      this.clearDelayTimer();
    });
    effect(() => {
      // read deps
      const _enabled = this.clickOutsideEnabled();
      const attachOnClick = this.attachOutsideOnClick();
      const useBlur = this.emitOnBlur();
      const events = this.parseEvents(this.clickOutsideEvents());
      const excludeSelector = this.exclude();
      const _excludeBefore = this.excludeBeforeClick();
      const _delay = this.delayClickOutsideInit();

      // Keep exclude cache fresh when selector changes (or becomes empty)
      this.refreshExcludedNodes(excludeSelector);

      // Reconfigure listeners
      this.detachAll();
      this.clearDelayTimer();

      if (attachOnClick) {
        this.attachHostInitListener(events);
      } else {
        // attach immediately (optionally delayed)
        this.initDocListenersWithOptionalDelay();
      }

      if (useBlur) {
        this.attachBlurListener();
      }
    });
  }

  // Stable bound handlers (required for add/removeEventListener)
  private readonly onDocEvent = (ev: Event): void => this.handleDocEvent(ev);
  private readonly onInitFromHostEvent = (_ev: Event): void => this.initDocListenersWithOptionalDelay();
  private readonly onWindowBlur = (ev: Event): void => this.handleWindowBlur(ev);

  // -----------------------
  // Core logic
  // -----------------------
  private initDocListenersWithOptionalDelay(): void {
    this.clearDelayTimer();
    if (this.delayClickOutsideInit()) {
      this.delayTimerId = window.setTimeout(() => {
        this.delayTimerId = null;
        this.attachDocListener(this.parseEvents(this.clickOutsideEvents()));
      }, 0);
    } else {
      this.attachDocListener(this.parseEvents(this.clickOutsideEvents()));
    }
  }

  private handleDocEvent(ev: Event): void {
    if (!this.clickOutsideEnabled()) return;
    if (this.excludeBeforeClick()) {
      this.refreshExcludedNodes(this.exclude());
    }

    const host = this.elRef.nativeElement;
    const target = ev.target as Node | null;

    // If event has no target, treat as outside
    const isInside = !!target && host.contains(target);
    const isExcluded = !!target && this.shouldExclude(target);
    if (!isInside && !isExcluded) {
      this.emit(ev);
      // If we only attach outside listener after first click on host,
      // remove it after successful outside click (matches your behavior).
      if (this.attachOutsideOnClick()) {
        this.detachDocListener();
      }
    }
  }

  /**
   * Resolves outside click on iframe (blur trick).
   */
  private handleWindowBlur(ev: Event): void {
    // Ensure we emit after focus transitions settle
    window.setTimeout(() => {
      if (!document.hidden) {
        this.emit(ev);
      }
    }, 0);
  }

  private emit(ev: Event): void {
    if (!this.clickOutsideEnabled()) return;
    this.ngZone.run(() => {
      this.clickOutside.emit(ev);
    });
  }

  // -----------------------
  // Exclude logic
  // -----------------------
  private refreshExcludedNodes(selector: string): void {
    if (!selector) {
      this.excludedNodes.set([]);
      return;
    }
    try {
      const nodes: HTMLElement[] = Array.from(document.querySelectorAll(selector));
      this.excludedNodes.set(nodes);
    } catch (err) {
      console.error('[clickOutside] Check your exclude selector syntax.', err);
      this.excludedNodes.set([]);
    }
  }

  private shouldExclude(target: Node): boolean {
    const nodes = this.excludedNodes();
    for (const excludedNode of nodes) {
      if (excludedNode.contains(target)) return true;
    }
    return false;
  }

  // -----------------------
  // Listener management
  // -----------------------
  private parseEvents(csv: string): DomEventName[] {
    const trimmed = csv.trim();
    if (!trimmed) return ['click'];
    return trimmed
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);
  }

  private attachDocListener(events: DomEventName[]): void {
    if (this.docEventsAttached.length) return; // already attached
    this.ngZone.runOutsideAngular(() => {
      for (const e of events) {
        document.addEventListener(e, this.onDocEvent, true);
      }
    });
    this.docEventsAttached = [...events];
  }

  private detachDocListener(): void {
    if (!this.docEventsAttached.length) return;
    const toRemove = this.docEventsAttached;
    this.docEventsAttached = [];
    this.ngZone.runOutsideAngular(() => {
      for (const e of toRemove) {
        document.removeEventListener(e, this.onDocEvent, true);
      }
    });
  }

  private attachHostInitListener(events: DomEventName[]): void {
    if (this.hostInitEventsAttached.length) return;
    const host = this.elRef.nativeElement;
    this.ngZone.runOutsideAngular(() => {
      for (const e of events) {
        host.addEventListener(e, this.onInitFromHostEvent, true);
      }
    });
    this.hostInitEventsAttached = [...events];
  }

  private detachHostInitListener(): void {
    if (!this.hostInitEventsAttached.length) return;
    const host = this.elRef.nativeElement;
    const toRemove = this.hostInitEventsAttached;
    this.hostInitEventsAttached = [];
    this.ngZone.runOutsideAngular(() => {
      for (const e of toRemove) {
        host.removeEventListener(e, this.onInitFromHostEvent, true);
      }
    });
  }

  private attachBlurListener(): void {
    if (this.blurAttached) return;
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('blur', this.onWindowBlur);
    });
    this.blurAttached = true;
  }

  private detachBlurListener(): void {
    if (!this.blurAttached) return;
    this.ngZone.runOutsideAngular(() => {
      window.removeEventListener('blur', this.onWindowBlur);
    });
    this.blurAttached = false;
  }

  private detachAll(): void {
    this.detachDocListener();
    this.detachHostInitListener();
    this.detachBlurListener();
  }

  private clearDelayTimer(): void {
    if (this.delayTimerId !== null) {
      window.clearTimeout(this.delayTimerId);
      this.delayTimerId = null;
    }
  }
}
