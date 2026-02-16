import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ITag, NewTag } from '../tag.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ITag for edit and NewTagFormGroupInput for create.
 */
type TagFormGroupInput = ITag | PartialWithRequiredKeyOf<NewTag>;

type TagFormDefaults = Pick<NewTag, 'id' | 'notes'>;

type TagFormGroupContent = {
  id: FormControl<ITag['id'] | NewTag['id']>;
  tagName: FormControl<ITag['tagName']>;
  color: FormControl<ITag['color']>;
  owner: FormControl<ITag['owner']>;
  notes: FormControl<ITag['notes']>;
};

export type TagFormGroup = FormGroup<TagFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class TagFormService {
  createTagFormGroup(tag: TagFormGroupInput = { id: null }): TagFormGroup {
    const tagRawValue = {
      ...this.getFormDefaults(),
      ...tag,
    };
    return new FormGroup<TagFormGroupContent>({
      id: new FormControl(
        { value: tagRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      tagName: new FormControl(tagRawValue.tagName, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(255)],
      }),
      color: new FormControl(tagRawValue.color, {
        validators: [Validators.maxLength(20)],
      }),
      owner: new FormControl(tagRawValue.owner, {
        validators: [Validators.required],
      }),
      notes: new FormControl(tagRawValue.notes ?? []),
    });
  }

  getTag(form: TagFormGroup): ITag | NewTag {
    return form.getRawValue() as ITag | NewTag;
  }

  resetForm(form: TagFormGroup, tag: TagFormGroupInput): void {
    const tagRawValue = { ...this.getFormDefaults(), ...tag };
    form.reset(
      {
        ...tagRawValue,
        id: { value: tagRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): TagFormDefaults {
    return {
      id: null,
      notes: [],
    };
  }
}
