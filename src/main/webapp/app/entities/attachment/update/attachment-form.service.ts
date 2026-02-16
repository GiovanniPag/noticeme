import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IAttachment, NewAttachment } from '../attachment.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IAttachment for edit and NewAttachmentFormGroupInput for create.
 */
type AttachmentFormGroupInput = IAttachment | PartialWithRequiredKeyOf<NewAttachment>;

type AttachmentFormDefaults = Pick<NewAttachment, 'id'>;

type AttachmentFormGroupContent = {
  id: FormControl<IAttachment['id'] | NewAttachment['id']>;
  fileName: FormControl<IAttachment['fileName']>;
  data: FormControl<IAttachment['data']>;
  dataContentType: FormControl<IAttachment['dataContentType']>;
  dataContentType: FormControl<IAttachment['dataContentType']>;
  fileSize: FormControl<IAttachment['fileSize']>;
  note: FormControl<IAttachment['note']>;
};

export type AttachmentFormGroup = FormGroup<AttachmentFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class AttachmentFormService {
  createAttachmentFormGroup(attachment: AttachmentFormGroupInput = { id: null }): AttachmentFormGroup {
    const attachmentRawValue = {
      ...this.getFormDefaults(),
      ...attachment,
    };
    return new FormGroup<AttachmentFormGroupContent>({
      id: new FormControl(
        { value: attachmentRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      fileName: new FormControl(attachmentRawValue.fileName, {
        validators: [Validators.required],
      }),
      data: new FormControl(attachmentRawValue.data, {
        validators: [Validators.required],
      }),
      dataContentType: new FormControl(attachmentRawValue.dataContentType),
      dataContentType: new FormControl(attachmentRawValue.dataContentType, {
        validators: [Validators.required],
      }),
      fileSize: new FormControl(attachmentRawValue.fileSize),
      note: new FormControl(attachmentRawValue.note, {
        validators: [Validators.required],
      }),
    });
  }

  getAttachment(form: AttachmentFormGroup): IAttachment | NewAttachment {
    return form.getRawValue() as IAttachment | NewAttachment;
  }

  resetForm(form: AttachmentFormGroup, attachment: AttachmentFormGroupInput): void {
    const attachmentRawValue = { ...this.getFormDefaults(), ...attachment };
    form.reset(
      {
        ...attachmentRawValue,
        id: { value: attachmentRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): AttachmentFormDefaults {
    return {
      id: null,
    };
  }
}
