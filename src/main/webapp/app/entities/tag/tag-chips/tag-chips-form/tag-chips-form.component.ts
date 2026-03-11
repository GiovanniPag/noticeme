import { Component, ViewChild, ElementRef, input, output, inject, signal, computed, effect } from '@angular/core';
import { NonNullableFormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { NgbTypeaheadModule, NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { HttpResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { Observable, OperatorFunction, of } from 'rxjs';

import { TagService } from '../../service/tag.service';
import { ITag } from '../../tag.model';
import SharedModule from 'app/shared/shared.module';

@Component({
  selector: 'jhi-tag-chips-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgbTypeaheadModule, SharedModule],
  styleUrls: ['./tag-chips-form.style.scss'],
  templateUrl: './tag-chips-form.template.html',
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
  readonly submitTag = output<{ type: 'text'; tagName: string; color: string } | { type: 'existing'; tag: ITag }>();
  readonly blurEvent = output<FocusEvent>();
  readonly keyUpEvent = output<KeyboardEvent>();
  readonly keyDownEvent = output<KeyboardEvent>();
  /* ==========================================================
   * Dependencies
   * ========================================================== */
  @ViewChild('typeahead') public popup!: NgbTypeahead;
  @ViewChild('tagInput', { static: true }) inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('formEl', { static: true }) formRef!: ElementRef<HTMLFormElement>;
  readonly searching = signal(false);
  readonly fb = inject(NonNullableFormBuilder);
  readonly form = this.fb.group({
    tagName: this.fb.control('', {
      validators: [minTrimmedLength(1), Validators.maxLength(255)],
    }),
    color: this.randomHexColor(), // default color (random)
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

  randomHexColor(): string {
    const random = Math.floor(Math.random() * 16777215);
    return `#${random.toString(16).padStart(6, '0')}`;
  }

  hasErrors(): boolean {
    return this.tagNameControl.invalid && (this.tagNameControl.dirty || this.tagNameControl.touched);
  }
  /* ==========================================================
   * Actions
   * ========================================================== */

  focus(): void {
    this._focused.set(true);
    this.inputRef.nativeElement.focus();
  }

  onInputBlur(event: FocusEvent): void {
    setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      const formEl = this.formRef.nativeElement;

      const insideForm = !!(active && formEl.contains(active));
      const insidePopup = !!active?.closest('.click-outside-exclude');

      if (insideForm || insidePopup) {
        this._focused.set(true);
        return;
      }
      this._focused.set(false);
      this.blurEvent.emit(event);
    }, 0);
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
      event.stopPropagation();
      this.submit();
      return;
    }
    this.keyDownEvent.emit(event);
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
    this.submitTag.emit({ type: 'text', tagName, color });
    this.reset();
  }

  reset(): void {
    this.form.reset({
      tagName: '',
      color: this.randomHexColor(),
    });
  }

  /* ==========================================================
   * Typeahead Search
   * ========================================================== */

  search: OperatorFunction<string, readonly ITag[]> = (text$: Observable<string>) =>
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
          .pipe(map((res: HttpResponse<ITag[]>) => res.body ?? []));
      }),
      tap(() => this.searching.set(false)),
    );

  readonly inputFormatter = (tag: ITag): string => tag.tagName ?? '';
  readonly resultFormatter = (tag: ITag): string => tag.tagName ?? '';

  onSelectItem(event: NgbTypeaheadSelectItemEvent<ITag>): void {
    event.preventDefault();
    this.submitTag.emit({
      type: 'existing',
      tag: event.item,
    });
    this.reset();
  }
  /* ==========================================================
   * Error Helper
   * ========================================================== */
  getErrorMessages(
    messages: Record<string, { msg: string; translateValues?: Record<string, unknown> }>,
  ): { msg: string; translateValues?: Record<string, unknown> }[] {
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
    const raw = (control.value as string | null | undefined) ?? '';
    const trimmed = raw.trim();
    // campo opzionale: se è vuoto non è un errore
    if (raw.length === 0) {
      return null;
    }
    return trimmed.length < min ? { minlength: { msg: 'entity.validation.minlength', translateValues: { min } } } : null;
  };
}
