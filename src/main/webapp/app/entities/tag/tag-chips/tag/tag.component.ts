import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal, ElementRef } from '@angular/core';

import { ITag } from 'app/entities/tag/tag.model';

@Component({
  selector: 'jhi-tag-chip',
  standalone: true,
  templateUrl: './tag.template.html',
  styleUrl: './tag-component.style.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.moving]': 'moving()',
    '[class.blink]': 'blinking()',
    '[style.background]': 'model().color ?? "#e0e0e0"',
    '[style.color]': 'textColor()',
    '(keydown)': 'onKeydown($event)',
    '(click)': 'select($event)',
    '[class.disabled]': 'disabled()',
    '[attr.tabindex]': '0',
    '[attr.aria-label]': 'model().id',
  },
})
export class TagComponent {
  /* ==========================================================
   * Inputs (signal-based)
   * ========================================================== */

  readonly model = input.required<ITag>();
  readonly index = input<number>(0);
  readonly disabled = input<boolean>(false);

  /* ==========================================================
   * Outputs
   * ========================================================== */

  readonly selectTag = output<ITag>();
  readonly removeTag = output<ITag>();
  readonly blurTag = output<ITag>();
  readonly keyDownTag = output<{ event: KeyboardEvent; model: ITag }>();

  /* ==========================================================
   * Internal state
   * ========================================================== */

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly moving = signal(false);
  private readonly blinking = signal(false);

  private readonly textColor = computed(() => {
    const color = this.model().color;
    if (!color) return '#000';

    const hex = color.slice(1);
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '#000' : '#fff';
  });

  /* ==========================================================
   * Actions
   * ========================================================== */
  select(event?: MouseEvent): void {
    if (this.disabled()) return;
    event?.stopPropagation();
    this.focus();
    this.selectTag.emit(this.model());
  }

  remove(event: MouseEvent): void {
    if (this.disabled()) return;
    event.stopPropagation();
    this.removeTag.emit(this.model());
  }

  focus(): void {
    this.element.nativeElement.focus();
  }

  move(): void {
    this.moving.set(true);
  }

  blink(): void {
    this.blinking.set(true);
    setTimeout(() => this.blinking.set(false), 80);
  }

  onKeydown(event: KeyboardEvent): void {
    this.keyDownTag.emit({
      event,
      model: this.model(),
    });
  }

  /**
   * @name onBlurred
   * @param event
   */
  onBlurred(): void {
    this.blurTag.emit(this.model());
  }
}
