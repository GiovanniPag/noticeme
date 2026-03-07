import { Directive, ElementRef, HostListener, AfterViewInit, inject, DestroyRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
  selector: 'textarea[jhiInputTextarea]',
  standalone: true,
})
export class InputTextareaDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngControl = inject(NgControl, { optional: true });

  constructor() {
    this.ngControl?.valueChanges?.pipe(startWith(this.ngControl.value), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      queueMicrotask(() => this.resize());
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.resize());
  }

  @HostListener('input')
  onInput(): void {
    this.resize();
  }

  resize(): void {
    const textarea = this.el.nativeElement;
    textarea.style.overflow = 'hidden';
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}
