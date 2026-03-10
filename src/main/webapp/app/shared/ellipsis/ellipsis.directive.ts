import {
  AfterViewInit,
  Directive,
  DestroyRef,
  ElementRef,
  NgZone,
  Renderer2,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

type ResizeStrategy = '' | 'manual' | 'resize-observer' | 'window';

/**
 * Directive to truncate the contained text, if it exceeds the element's boundaries
 * and append characters (configurable, default '...') if so.
 */
@Directive({
  selector: '[jhiEllipsis]',
  standalone: true,
})
export class EllipsisDirective implements AfterViewInit {
  // -----------------------
  // Inputs
  // -----------------------
  readonly ellipsis = input<string>('...');
  readonly showMore = input<boolean>(false);
  readonly ellipsisContent = input<string | number | null>(null);
  readonly ellipsisWordBoundaries = input<string>('');
  readonly ellipsisSubstrFn = input<(str: string, from: number, length?: number) => string>((str, from, length) =>
    length !== undefined ? str.slice(from, from + length) : str.slice(from),
  );
  readonly resizeDetection = input<ResizeStrategy>('');
  // -----------------------
  // Outputs
  // -----------------------
  readonly moreClickEmitter = output<MouseEvent>();
  readonly changeEmitter = output<number | null>();
  // -----------------------
  // injects
  // -----------------------
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  // -----------------------
  // Internal state
  // -----------------------
  private readonly domReady = signal(false);
  private elem!: HTMLElement;
  private innerElem!: HTMLDivElement;
  private moreAnchor!: HTMLAnchorElement;
  private resizeObserver?: ResizeObserver;
  private removeWindowResizeListener?: () => void;
  private destroyMoreClickListener?: () => void;

  private previousDimensions = { width: 0, height: 0 };
  private readonly initialDomText = signal<string>('');
  // guard to prevent resize loops while measuring/applying
  private suppressResize = false;

  private readonly boundaryRegexClass = computed(() => {
    const raw = this.ellipsisWordBoundaries();
    // convert "\n" -> newline and escape regex chars, then wrap into a char class
    const normalized = raw.replace(/\\n/, '\n').replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    return `[${normalized}]`;
  });

  private readonly originalText = computed(() => {
    const c = this.ellipsisContent();
    if (c !== null) return String(c);
    return this.initialDomText();
  });

  constructor() {
    effect(() => {
      if (!this.domReady()) return;
      this.moreAnchor.textContent = this.normalizeEllipsis(this.ellipsis());
    });

    effect(() => {
      if (!this.domReady()) return;

      const strategy = this.resizeDetection();
      this.detachResizeListener();
      this.attachResizeListener(strategy);

      if (strategy !== 'manual') {
        this.applyEllipsis();
      }
    });

    effect(() => {
      if (!this.domReady()) return;

      void this.originalText();
      void this.boundaryRegexClass();
      void this.ellipsisSubstrFn();
      void this.ellipsis();

      if (this.resizeDetection() !== 'manual') {
        this.applyEllipsis();
      }
    });
  }

  ngAfterViewInit(): void {
    this.elem = this.elementRef.nativeElement;
    this.initialDomText.set((this.elem.textContent ?? '').trim());
    // Setup wrapper + anchor
    this.setupDom();

    this.previousDimensions = {
      width: this.elem.clientWidth,
      height: this.elem.clientHeight,
    };
    // Cleanup
    this.destroyRef.onDestroy(() => this.cleanupAll());
    this.domReady.set(true);
    // Initial apply (if not manual)
    if (this.resizeDetection() !== 'manual') {
      this.applyEllipsis();
    }
  }

  // -----------------------
  // Public API
  // -----------------------
  public applyEllipsis(): void {
    if (!this.domReady()) return;
    this.suppressResize = true;
    const text = this.originalText();
    const maxLength = this.numericBinarySearch(text.length, curLength => {
      this.truncateText(curLength, false);
      return !this.isOverflowing();
    });

    const finalLength = this.truncateText(maxLength, this.showMore());
    this.suppressResize = false;
    const truncated = text.length !== finalLength;
    this.changeEmitter.emit(truncated ? finalLength : null);
  }

  // -----------------------
  // DOM setup + listeners
  // -----------------------
  private setupDom(): void {
    // Create anchor
    this.moreAnchor = this.renderer.createElement('a');
    this.moreAnchor.className = 'ellipsis-more';
    this.moreAnchor.href = '#';
    this.moreAnchor.textContent = this.normalizeEllipsis(this.ellipsis());

    // Create wrapper div
    this.renderer.setProperty(this.elem, 'innerHTML', '');
    this.innerElem = this.renderer.createElement('div');
    this.renderer.addClass(this.innerElem, 'ellipsis-inner');
    this.renderer.appendChild(this.elem, this.innerElem);
  }

  private attachResizeListener(strategy: ResizeStrategy): void {
    switch (strategy) {
      case 'manual':
        // user triggers applyEllipsis
        return;
      case 'window':
        this.attachWindowResizeListener();
        return;
      case '':
      case 'resize-observer':
        this.attachElementResizeListener();
        return;
    }
  }

  private detachResizeListener(): void {
    if (this.removeWindowResizeListener) {
      this.removeWindowResizeListener();
      this.removeWindowResizeListener = undefined;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  private attachWindowResizeListener(): void {
    if (this.removeWindowResizeListener) return;
    this.removeWindowResizeListener = this.renderer.listen('window', 'resize', () => {
      if (this.suppressResize) return;
      this.ngZone.run(() => {
        this.applyEllipsis();
      });
    });
  }

  private attachElementResizeListener(): void {
    if (this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.suppressResize) return;
      window.requestAnimationFrame(() => {
        const w = this.elem.clientWidth;
        const h = this.elem.clientHeight;
        if (w !== this.previousDimensions.width || h !== this.previousDimensions.height) {
          this.previousDimensions = { width: w, height: h };
          this.ngZone.run(() => this.applyEllipsis());
        }
      });
    });
    this.resizeObserver.observe(this.elem);
  }

  private cleanupAll(): void {
    this.detachResizeListener();
    if (this.destroyMoreClickListener) {
      this.destroyMoreClickListener();
      this.destroyMoreClickListener = undefined;
    }
  }

  // -----------------------
  // Truncation logic
  // -----------------------
  private truncateText(max: number, addMoreListener: boolean): number {
    const original = this.originalText();
    const text = this.getTruncatedText(original, max);
    const truncatedLength = text.length;
    const textTruncated = truncatedLength !== original.length;
    this.renderer.setProperty(this.innerElem, 'textContent', '');

    // Remove any existing more click listener:
    if (this.destroyMoreClickListener) {
      this.destroyMoreClickListener();
      this.destroyMoreClickListener = undefined;
    }

    if (!textTruncated) {
      this.renderer.appendChild(this.innerElem, this.renderer.createText(text));
      return truncatedLength;
    }

    if (this.showMore()) {
      this.renderer.appendChild(this.innerElem, this.renderer.createText(text));

      this.moreAnchor.textContent = this.normalizeEllipsis(this.ellipsis());
      this.renderer.appendChild(this.innerElem, this.moreAnchor);

      if (addMoreListener) {
        this.destroyMoreClickListener = this.renderer.listen(this.moreAnchor, 'click', (e: MouseEvent) => {
          e.preventDefault();
          this.moreClickEmitter.emit(e);
        });
      }
    } else {
      const finalText = text + this.normalizeEllipsis(this.ellipsis());
      this.renderer.appendChild(this.innerElem, this.renderer.createText(finalText));
    }
    return truncatedLength;
  }

  private getTruncatedText(original: string, max: number): string {
    if (!original || original.length <= max) return original;

    const substrFn = this.ellipsisSubstrFn();
    const truncatedText = substrFn(original, 0, max);
    const boundaryClass = this.boundaryRegexClass();

    if (boundaryClass === '[]' || original.charAt(max).match(boundaryClass)) {
      return truncatedText;
    }

    let i = max - 1;
    while (i > 0 && !truncatedText.charAt(i).match(boundaryClass)) i--;
    return substrFn(truncatedText, 0, i);
  }

  private isOverflowing(): boolean {
    const currentOverflow = this.elem.style.overflow;
    if (!currentOverflow || currentOverflow === 'visible') {
      this.elem.style.overflow = 'hidden';
    }
    const isOverflowing = this.elem.clientWidth < this.elem.scrollWidth - 1 || this.elem.clientHeight < this.elem.scrollHeight - 1;
    this.elem.style.overflow = currentOverflow;
    return isOverflowing;
  }

  private normalizeEllipsis(v: string | null | undefined): string {
    if (v === '') return '...';
    if (v === null || v === undefined) return '';
    return v;
  }

  private numericBinarySearch(max: number, callback: (n: number) => boolean): number {
    let low = 0;
    let high = max;
    let best = -1;
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      if (callback(mid)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return best;
  }
}
