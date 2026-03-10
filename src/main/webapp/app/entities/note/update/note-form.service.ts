import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { DATE_TIME_FORMAT, DATE_TIME_INPUT_FORMAT } from 'app/config/input.constants';
import MinDateValidator from 'app/shared/date/min-date-validator.directive';
import { INote, NewNote } from '../note.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts INote for edit and NewNoteFormGroupInput for create.
 */
type NoteFormGroupInput = INote | PartialWithRequiredKeyOf<NewNote>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends INote | NewNote> = Omit<T, 'alarmDate'> & {
  alarmDate?: string | null;
};

type NoteFormRawValue = FormValueOf<INote>;

type NewNoteFormRawValue = FormValueOf<NewNote>;

type NoteFormDefaults = Pick<NewNote, 'id' | 'title' | 'content' | 'alarmDate' | 'status' | 'tags'>;

type NoteFormGroupContent = {
  id: FormControl<NoteFormRawValue['id'] | NewNote['id']>;
  title: FormControl<NoteFormRawValue['title']>;
  content: FormControl<NoteFormRawValue['content']>;
  alarmDate: FormControl<NoteFormRawValue['alarmDate']>;
  status: FormControl<NoteFormRawValue['status']>;
  owner: FormControl<NoteFormRawValue['owner']>;
  tags: FormControl<NoteFormRawValue['tags']>;
};

export type NoteFormGroup = FormGroup<NoteFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class NoteFormService {
  createNoteFormGroup(note: NoteFormGroupInput = { id: null }): NoteFormGroup {
    const noteRawValue = this.convertNoteToNoteRawValue({
      ...this.getFormDefaults(),
      ...note,
    });
    return new FormGroup<NoteFormGroupContent>({
      id: new FormControl(
        { value: noteRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      title: new FormControl(noteRawValue.title, {
        validators: [Validators.maxLength(255)],
      }),
      content: new FormControl(noteRawValue.content, {
        validators: [Validators.maxLength(20000)],
      }),
      alarmDate: new FormControl(noteRawValue.alarmDate, {
        validators: [MinDateValidator(dayjs().format(DATE_TIME_INPUT_FORMAT))],
      }),
      status: new FormControl(noteRawValue.status, {
        validators: [Validators.required],
      }),
      owner: new FormControl(noteRawValue.owner),
      tags: new FormControl(noteRawValue.tags ?? []),
    });
  }

  getNote(form: NoteFormGroup): INote | NewNote {
    return this.convertNoteRawValueToNote(form.getRawValue() as NoteFormRawValue | NewNoteFormRawValue);
  }

  resetForm(form: NoteFormGroup, note: NoteFormGroupInput): void {
    const noteRawValue = this.convertNoteToNoteRawValue({ ...this.getFormDefaults(), ...note });
    form.reset(
      {
        ...noteRawValue,
        id: { value: noteRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): NoteFormDefaults {
    return {
      id: null,
      title: '',
      content: '',
      alarmDate: null,
      status: NoteStatus.NORMAL,
      tags: [],
    };
  }

  private convertNoteRawValueToNote(rawNote: NoteFormRawValue | NewNoteFormRawValue): INote | NewNote {
    return {
      ...rawNote,
      alarmDate: dayjs(rawNote.alarmDate, DATE_TIME_FORMAT),
    };
  }

  private convertNoteToNoteRawValue(
    note: INote | (Partial<NewNote> & NoteFormDefaults),
  ): NoteFormRawValue | PartialWithRequiredKeyOf<NewNoteFormRawValue> {
    return {
      ...note,
      alarmDate: note.alarmDate ? note.alarmDate.format(DATE_TIME_FORMAT) : undefined,
      tags: note.tags ?? [],
    };
  }
}
