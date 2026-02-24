import { Component, QueryList, ViewChildren, inject, forwardRef, input, output, signal, computed, effect, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import { ITag } from 'app/entities/tag/tag.model';
import { TagService } from 'app/entities/tag/service/tag.service';
import { TagChipsFormComponent } from '../tag-chips-form/tag-chips-form.component';

import { default_tag_input } from 'app/config/tag-chips.constants';
import { TagComponent } from '../tag/tag.component';

@Component({
  selector: 'jhi-tag-input',
  standalone: true,
  imports: [TagComponent, TagChipsFormComponent],
  styleUrl: './tag-input.style.scss',
  templateUrl: './tag-input.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
  host: {
    '[attr.tabindex]': '-1',
    '[class.ng2-tag-input--disabled]': 'disabled()',
    '[class.ng2-tag-input--invalid]': 'hasErrors()',
    '[class.ng2-tag-input--focused]': 'isInputFocused()',
  },
})
export class TagInputComponent implements ControlValueAccessor {
  /* ------------------ Inputs ------------------ */
  placeholder = input<string>(default_tag_input.placeholder);
  secondaryPlaceholder = input<string>(default_tag_input.secondaryPlaceholder);
  disabled = input<boolean>(default_tag_input.disable);
  noteid = input<number | undefined>();
  separatorKeys: string[] = default_tag_input.separatorKeyCodes;
  hideForm = default_tag_input.hideForm;
  errorMessages = default_tag_input.errorMessages;
  theme = default_tag_input.theme;
  inputId = default_tag_input.inputId;
  inputClass = default_tag_input.inputClass;
  /* ------------------ Outputs ------------------ */
  tagAdded = output<ITag>();
  tagRemoved = output<ITag>();
  /* ------------------ ViewChild ------------------ */
  @ViewChild(TagChipsFormComponent) inputForm?: TagChipsFormComponent;
  @ViewChildren(TagComponent) tagComponents!: QueryList<TagComponent>;
  /* ------------------ State ------------------ */
  readonly tags = computed(() => this._tags());
  // TODO: is selected index even needed?
  readonly selectedIndex = signal<number | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  readonly formStatus = computed(() => this.inputForm?.form.status ?? null);

  readonly errors = computed(() => {
    if (!this.inputForm) return [];
    if (this.formStatus() === 'PENDING') return [];
    return this.inputForm.getErrorMessages(this.errorMessages);
  });
  /* ------------------ CVA ------------------ */
  private _tags = signal<ITag[]>([]);
  private readonly tagService = inject(TagService);
  constructor() {
    effect(() => {
      this.onChange(this._tags());
    });
  }
  onChange: (value: ITag[]) => void = () => {};
  onTouched: () => void = () => {};
  writeValue(value: ITag[] | null): void {
    this._tags.set(value ?? []);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  /* ------------------ Public API ------------------ */
  focus(applyFocus = false): void {
    this.selectedIndex.set(null);
    if (applyFocus) {
      this.inputForm?.focus();
    }
  }

  blur(): void {
    this.onTouched();
    // clear input after a short delay to allow event propagation
    setTimeout(() => {
      if (this.inputForm) {
        this.inputForm.inputText = '';
      }
    }, 50);
  }

  removeTag(tag: ITag): void {
    const index = this.tags().indexOf(tag);
    this._tags.update(tags => tags.filter(t => t !== tag));
    if (this.selectedIndex() === index) {
      this.selectedIndex.set(null);
    } else if (this.selectedIndex() !== null && this.selectedIndex() > index) {
      // Adjust selectedIndex if a tag above was removed
      this.selectedIndex.set(this.selectedIndex() - 1);
    }
    this.focus(true);
    this.tagRemoved.emit(tag);
  }

  addTagByName(tagName: string): void {
    const trimmed = tagName.trim();
    if (!trimmed || this.isDuplicate(trimmed)) return;
    this.isLoading.set(true);
    this.tagService.findByName(trimmed).subscribe({
      next: (res: HttpResponse<ITag>) => {
        this.isLoading.set(false);
        if (res.body) {
          this.appendTag(res.body);
        } else {
          this.createTag(trimmed);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  public onTagBlurred(changedElement: ITag, index: number): void {
    this._tags.update(tags => {
      const copy = [...tags];
      copy[index] = changedElement;
      return copy;
    });
    this.blur();
  }

  public selectItem(index: number): void {
    if (this.selectedIndex() === index) {
      return;
    }
    this.selectedIndex.set(index);
  }
  /* ------------------------------------------------------------------
   * Keyboard Handling
   * ------------------------------------------------------------------ */
  onTagKeydown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'Backspace':
      case 'Delete':
        this.removeTag(this.tags()[index]);
        break;
      case 'ArrowLeft':
        this.focusPrevious(index);
        break;
      case 'ArrowRight':
        this.focusNext(index);
        break;
      case 'Tab':
        if (event.shiftKey) {
          this.focusPrevious(index);
        } else {
          this.focusNext(index);
        }
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (this.separatorKeys.includes(event.key)) {
      event.preventDefault();
      const value = this.inputForm?.inputText;
      if (value) {
        this.addTagByName(value);
      }
    }
    if (event.key === 'Backspace' && !this.inputForm?.inputText) {
      const lastIndex = this.tags().length - 1;
      if (lastIndex >= 0) {
        this.focusPrevious(this.tags().length);
      }
    }
  }

  /* ------------------------------------------------------------------
   * Errors (Signal-based)
   * ------------------------------------------------------------------ */

  hasErrors(): boolean {
    const currentErrors = this.errors();
    return Array.isArray(currentErrors) && currentErrors.length > 0;
  }

  isInputFocused(): boolean {
    return this.inputForm?.isInputFocused() ?? false;
  }

  /* ------------------ Private ------------------ */
  private appendTag(tag: ITag): void {
    this._tags.update(tags => [...tags, tag]);
    this.tagAdded.emit(tag);
    this.inputForm?.reset();
    this.focus();
  }

  private createTag(tagName: string): void {
    this.isSaving.set(true);
    this.tagService
      .create({
        id: null,
        tagName,
        color: this.inputForm?.tagColorControl.value,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res: HttpResponse<ITag>) => {
          if (res.body) {
            this.appendTag(res.body);
          }
        },
      });
  }

  private isDuplicate(name: string): boolean {
    const dupe = this._tags().find(t => t.tagName === name);
    if (dupe) {
      const index = this._tags().indexOf(dupe);
      const tagComponent = this.tagComponents.get(index);
      tagComponent?.blink();
    }
    return !!dupe;
  }

  private focusPrevious(index: number): void {
    if (index <= 0) {
      this.focus(true);
      return;
    }
    this.tagComponents.get(index - 1)?.focus();
    this.selectedIndex.set(index - 1);
  }

  private focusNext(index: number): void {
    if (index >= this.tags().length - 1) {
      this.focus(true);
      return;
    }
    this.tagComponents.get(index + 1)?.focus();
    this.selectedIndex.set(index + 1);
  }
}
