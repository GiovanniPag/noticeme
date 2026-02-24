import { Component, ViewChild, ChangeDetectionStrategy, ElementRef, input, output, inject, signal, computed, effect } from '@angular/core';
import { NonNullableFormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { Observable, OperatorFunction, of } from 'rxjs';

import { TagService } from '../../service/tag.service';
import { ITag } from '../../tag.model';

@Component({
  selector: 'jhi-tag-chips-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgbTypeaheadModule],
  styleUrls: ['./tag-chips-form.style.scss'],
  templateUrl: './tag-chips-form.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagChipsFormComponent {
  /* ==========================================================
   * Inputs (Signals)
   * ========================================================== */
  readonly placeholder = input<string>('');
  readonly inputId = input<string | null>(null);
  readonly noteId = input<number | undefined>();
  readonly existingTags = input<ITag[] | undefined>([]);
  readonly inputClass = input<string>('');
  readonly disabled = input<boolean>(false);
  /* ==========================================================
   * Outputs
   * ========================================================== */
  readonly submitTag = output<{ tagName: string; color?: string }>();
  readonly blurEvent = output<FocusEvent>();
  readonly keyUpEvent = output<KeyboardEvent>();
  readonly keyDownEvent = output<KeyboardEvent>();
  /* ==========================================================
   * Dependencies
   * ========================================================== */
  @ViewChild('tagInput', { static: true }) inputRef!: ElementRef<HTMLInputElement>;
  readonly searching = signal(false);
  readonly hasErrors = computed(() => this.tagNameControl.invalid && this.tagNameControl.dirty);
  readonly fb = inject(NonNullableFormBuilder);
  readonly form = this.fb.group({
    tagName: this.fb.control('', {
      validators: [minTrimmedLength(1), Validators.maxLength(255)],
    }),
    color: this.fb.control('#3b82f6'), // default color (blue)
  });
  readonly tagNameControl = this.form.controls.tagName;
  readonly tagColorControl = this.form.controls.color;
  private readonly tagService = inject(TagService);
  private _focused = signal(false);

  constructor() {
    // react to disabled signal
    effect(() => {
      if (this.disabled()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  /* ==========================================================
   * Actions
   * ========================================================== */

  focus(): void {
    this._focused.set(true);
    this.inputRef.nativeElement.focus();
  }

  blur(): void {
    this._focused.set(false);
    this.inputRef.nativeElement.blur();
  }

  set inputText(text: string) {
    this.tagNameControl.setValue(text);
  }

  get inputText(): string {
    return this.tagNameControl.value.trim();
  }

  public isInputFocused(): boolean {
    return this._focused();
  }

  /* ==========================================================
   * Keyboard Handling
   * ========================================================== */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!this.hasErrors() && this.tagNameControl.value.trim()) {
        this.submit();
      }
    } else {
      this.keyDownEvent.emit(event);
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyUpEvent.emit(event);
  }

  /* ==========================================================
   * Submit
   * ========================================================== */

  submit(): void {
    const tagName = this.tagNameControl.value.trim();
    const color = this.form.controls.color.value;
    if (!tagName || this.hasErrors()) return;
    this.submitTag.emit({ tagName, color });
    this.reset();
  }

  reset(): void {
    const color = this.form.controls.color.value;
    this.form.reset({
      tagName: '',
      color,
    });
  }

  /* ==========================================================
   * Typeahead Search
   * ========================================================== */

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching.set(true)),
      switchMap(value => {
        const trimmed = value.trim();
        if (!trimmed) {
          return of([]);
        }
        return this.tagService
          .query({
            page: 0,
            size: 10,
            initial: trimmed,
            noteid: this.noteId(),
            filterby: this.existingTags()?.map(t => t.tagName) ?? [],
          })
          .pipe(map((res: HttpResponse<ITag[]>) => res.body?.map(tag => tag.tagName ?? '') ?? []));
      }),
      tap(() => this.searching.set(false)),
    );

  /* ==========================================================
   * Error Helper
   * ========================================================== */
  getErrorMessages(
    messages: Record<string, { msg: string; translateValues?: Record<string, unknown> }>,
  ): Record<string, { msg: string; translateValues?: Record<string, unknown> }> {
    return Object.keys(messages)
      .filter(err => this.tagNameControl.hasError(err))
      .map(err => messages[err]);
  }
}

/* ==========================================================
 * Standalone Validator
 * ========================================================== */
function minTrimmedLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value as string).trim();
    return value.length < min ? { minlength: { msg: 'entity.validation.minlength', TranslateValues: { min: 1 } } } : null;
  };
}
