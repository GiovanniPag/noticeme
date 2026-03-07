import { AfterViewInit, Component, ViewChild, computed, effect, inject, output, signal } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { finalize, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import dayjs from 'dayjs/esm';

import { INote } from '../note.model';
import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';
import { NoteService } from '../service/note.service';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { NoteFormGroup, NoteFormService } from '../update/note-form.service';
import { TagInputComponent } from 'app/entities/tag/tag-chips/tag-input/tag-input.component';

import SharedModule from 'app/shared/shared.module';
import { ClickOutsideDirective } from 'app/shared/outside/click-outside.directive';
import { InputTextareaDirective } from 'app/shared/autosize/autotextarea.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';

import { AlertService, Alert } from 'app/core/util/alert.service';
import { DATE_TIME_FORMAT, DATE_TIME_INPUT_FORMAT } from 'app/config/input.constants';

@Component({
  selector: 'jhi-note-create',
  templateUrl: './note-create.component.html',
  styleUrls: ['../note.scss'],
  standalone: true,
  imports: [SharedModule, FormsModule, ReactiveFormsModule, ClickOutsideDirective, InputTextareaDirective],
})
export class NoteCreateComponent implements AfterViewInit {
  // output event
  readonly oncreate = output<INote>();
  // constants
  readonly maxTitleLength = 255;
  readonly maxContentLength = 20000;
  readonly minDate = dayjs().format(DATE_TIME_INPUT_FORMAT);
  readonly noteStatusValues = Object.keys(NoteStatus);
  // ----- Signals (component state) -----
  readonly usersSharedCollection = signal<IUser[]>([]);
  readonly isSaving = signal(false);
  readonly selected = signal(false);
  // ----- Alerts
  readonly alerts = signal<Alert[]>([]);
  readonly alertMaxTitle = signal<Alert | undefined>(undefined);
  readonly alertMaxContent = signal<Alert | undefined>(undefined);
  // ----- View refs -----
  @ViewChild('tagInput') private readonly tagInput?: TagInputComponent;
  // ----- Injects
  private readonly dataUtils = inject(DataUtils);
  private readonly eventManager = inject(EventManager);
  private readonly noteService = inject(NoteService);
  private readonly noteFormService = inject(NoteFormService);
  private readonly userService = inject(UserService);
  private readonly alertService = inject(AlertService);
  // ---- FORM
  readonly noteCreateForm: NoteFormGroup = this.noteFormService.createNoteFormGroup();
  // ----- Derived state -----
  private readonly hasValue = computed((): boolean => {
    const title = (this.noteCreateForm.controls.title.value ?? '').trim();
    const content = (this.noteCreateForm.controls.content.value ?? '').trim();
    const alarmDate = this.noteCreateForm.controls.alarmDate.value;
    const alarmValid = !!alarmDate && dayjs(alarmDate, DATE_TIME_FORMAT, true).isValid();
    return title.length > 0 || content.length > 0 || alarmValid || (this.noteCreateForm.controls.tags.value?.length ?? 0) > 0;
  });

  readonly canSubmit = computed((): boolean => {
    const alarmInvalid = this.noteCreateForm.controls.alarmDate.invalid;
    const otherOk =
      this.noteCreateForm.controls.status.valid && this.noteCreateForm.controls.title.valid && this.noteCreateForm.controls.content.valid;
    const formOk = this.noteCreateForm.valid || (alarmInvalid && otherOk);
    return formOk && !this.isSaving() && !this.selected() && this.hasValue();
  });

  constructor() {
    this.alerts.set(this.alertService.get());
    this.resetForm();
    this.loadRelationshipsOptions();
    // Live warning alerts (no DOM needed; just watch form controls)
    effect(() => {
      const titleLen = (this.noteCreateForm.controls.title.value ?? '').length;
      const current = this.alertMaxTitle();
      this.alertMaxTitle.set(this.checkInputLenght(100, 'warning.titlelength', titleLen, this.maxTitleLength, current));
    });

    effect(() => {
      const contentLen = (this.noteCreateForm.controls.content.value ?? '').length;
      const current = this.alertMaxContent();
      this.alertMaxContent.set(this.checkInputLenght(500, 'warning.contentlength', contentLen, this.maxContentLength, current));
    });
  }

  ngAfterViewInit(): void {
    const popup = this.tagInput?.inputForm?.popup;
    popup?.selectItem.subscribe(() => {
      this.selected.set(true);
      setTimeout(() => this.selected.set(false), 10);
    });
  }

  // ----- UI actions -----
  closeAndSaveNote(): void {
    if (this.canSubmit()) this.save();
  }

  unPinNote(): void {
    this.noteCreateForm.controls.status.setValue(NoteStatus.NORMAL);
  }

  pinNote(): void {
    this.noteCreateForm.controls.status.setValue(NoteStatus.PINNED);
  }

  resetDate(): void {
    this.noteCreateForm.controls.alarmDate.reset(null);
  }

  // ----- File helpers -----
  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  setFileData(event: Event, field: string, isImage: boolean): void {
    this.dataUtils.loadFileToForm(event, this.noteCreateForm, field, isImage).subscribe({
      error: (err: FileLoadError) =>
        this.eventManager.broadcast(new EventWithContent<AlertError>('noticeMeApp.error', { ...err, key: 'error.file.' + err.key })),
    });
  }

  // ----- Save flow -----
  save(): void {
    this.isSaving.set(true);
    const note = this.noteFormService.getNote(this.noteCreateForm);
    if (note.id === null) {
      this.subscribeToSaveResponse(this.noteService.create(note));
      return;
    }
    this.isSaving.set(false);
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<INote>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: res => (res.body ? this.onSaveSuccess(res.body) : this.onSaveError()),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(newNote: INote): void {
    this.oncreate.emit(newNote);
    this.resetForm();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving.set(false);
  }

  // ----- Alerts -----
  private addWarningAlert(translationKey?: string, translationParams?: Record<string, unknown>): Alert {
    return this.alertService.addAlert({ type: 'warning', timeout: 0, translationKey, translationParams }, this.alerts());
  }

  private checkInputLenght(
    limit: number,
    translationKey: string,
    currentLength: number,
    maxLength: number,
    alertToDisplay: Alert | undefined,
  ): Alert | undefined {
    const remaining = Math.max(0, maxLength - currentLength);
    if (remaining <= limit) {
      if (!alertToDisplay || alertToDisplay.closed === true) {
        alertToDisplay = this.addWarningAlert(translationKey, { remainingCharachters: remaining });
      } else {
        alertToDisplay.translationParams!.remainingCharachters = remaining;
        this.alertService.translateDynamicMessage(alertToDisplay);
      }
    } else {
      if (alertToDisplay?.closed === false) {
        alertToDisplay.close?.(this.alerts());
      }
    }
    return alertToDisplay;
  }

  // ----- Form helpers -----
  private resetForm(): void {
    const a1 = this.alertMaxTitle();
    if (a1?.closed === false) a1.close?.(this.alerts());
    const a2 = this.alertMaxContent();
    if (a2?.closed === false) a2.close?.(this.alerts());
    this.noteFormService.resetForm(this.noteCreateForm, { id: null });
  }

  private loadRelationshipsOptions(): void {
    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(map((users: IUser[]) => this.userService.addUserToCollectionIfMissing<IUser>(users)))
      .subscribe((users: IUser[]) => this.usersSharedCollection.set(users));
  }

  getSelectedUser(option: IUser, selectedVals?: IUser[] | null): IUser {
    return selectedVals?.find(v => v.id === option.id) ?? option;
  }
}
