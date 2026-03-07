import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import dayjs, { Dayjs } from 'dayjs/esm';

export default function MinDateValidator(minDate: string | Date): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // null, undefined, empty string → valid
    // Convert control value to dayjs
    const controlDate: Dayjs = dayjs(value, DATE_TIME_FORMAT);
    if (!controlDate.isValid()) return null; // invalid dates are ignored
    // Convert minDate to dayjs
    const validationDate: Dayjs = dayjs(minDate, DATE_TIME_FORMAT);
    return controlDate.isBefore(validationDate) ? { invalidDate: { value: control.value, min: minDate } } : null;
  };
}
