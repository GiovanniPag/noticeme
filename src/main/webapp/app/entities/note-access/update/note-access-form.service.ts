import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { INoteAccess, NewNoteAccess } from '../note-access.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts INoteAccess for edit and NewNoteAccessFormGroupInput for create.
 */
type NoteAccessFormGroupInput = INoteAccess | PartialWithRequiredKeyOf<NewNoteAccess>;

type NoteAccessFormDefaults = Pick<NewNoteAccess, 'id'>;

type NoteAccessFormGroupContent = {
  id: FormControl<INoteAccess['id'] | NewNoteAccess['id']>;
  role: FormControl<INoteAccess['role']>;
  note: FormControl<INoteAccess['note']>;
  user: FormControl<INoteAccess['user']>;
};

export type NoteAccessFormGroup = FormGroup<NoteAccessFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class NoteAccessFormService {
  createNoteAccessFormGroup(noteAccess: NoteAccessFormGroupInput = { id: null }): NoteAccessFormGroup {
    const noteAccessRawValue = {
      ...this.getFormDefaults(),
      ...noteAccess,
    };
    return new FormGroup<NoteAccessFormGroupContent>({
      id: new FormControl(
        { value: noteAccessRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      role: new FormControl(noteAccessRawValue.role, {
        validators: [Validators.required],
      }),
      note: new FormControl(noteAccessRawValue.note, {
        validators: [Validators.required],
      }),
      user: new FormControl(noteAccessRawValue.user, {
        validators: [Validators.required],
      }),
    });
  }

  getNoteAccess(form: NoteAccessFormGroup): INoteAccess | NewNoteAccess {
    return form.getRawValue() as INoteAccess | NewNoteAccess;
  }

  resetForm(form: NoteAccessFormGroup, noteAccess: NoteAccessFormGroupInput): void {
    const noteAccessRawValue = { ...this.getFormDefaults(), ...noteAccess };
    form.reset(
      {
        ...noteAccessRawValue,
        id: { value: noteAccessRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): NoteAccessFormDefaults {
    return {
      id: null,
    };
  }
}
