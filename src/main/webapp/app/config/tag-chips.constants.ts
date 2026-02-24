import { Observable } from 'rxjs';
import { ValidatorFn } from '@angular/forms';
import { ITag } from 'app/entities/tag/tag.model';

/* =========================================================
 * Constants
 * ========================================================= */
export const PLACEHOLDER = 'noticeMeApp.note.placeholder.tag_1';
export const SECONDARY_PLACEHOLDER = 'noticeMeApp.note.placeholder.tag_2';
export const APP_THEME = 'noticeme-theme';

/* =========================================================
 * Types
 * ========================================================= */
export interface TagInputErrorMessage {
  msg: string;
  translateValues?: Record<string, unknown>;
}

export interface TagInputOptions {
  separatorKeyCodes: readonly string[];
  placeholder: string;
  secondaryPlaceholder: string;
  validators: readonly ValidatorFn[];
  errorMessages: Record<string, TagInputErrorMessage>;
  theme: string;
  hideForm: boolean;
  inputId: string | null;
  inputClass: string;
  disable: boolean;
  onRemoving?: (tag: ITag) => Observable<ITag>;
  onAdding?: (tag: ITag) => Observable<ITag>;
}

/* =========================================================
 * Default Error Messages
 * ========================================================= */

export const DEFAULT_ERROR_MESSAGES = {
  maxlength: {
    msg: 'entity.validation.maxlength',
    translateValues: { max: 50 },
  },
  minlength: {
    msg: 'entity.validation.minlength',
    translateValues: { min: 1 },
  },
} satisfies Record<string, TagInputErrorMessage>;

/* =========================================================
 * Defaults
 * ========================================================= */

export const default_tag_input = {
  separatorKeyCodes: [],
  placeholder: PLACEHOLDER,
  secondaryPlaceholder: SECONDARY_PLACEHOLDER,
  validators: [],
  errorMessages: DEFAULT_ERROR_MESSAGES,
  theme: APP_THEME,
  hideForm: false,
  inputId: null,
  inputClass: '',
  disable: false,
  onRemoving: undefined,
  onAdding: undefined,
} satisfies TagInputOptions;
