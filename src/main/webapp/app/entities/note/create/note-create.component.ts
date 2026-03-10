import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, computed, effect, inject, output, signal } from '@angular/core';
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

import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';

import { DATE_TIME_FORMAT, DATE_TIME_INPUT_FORMAT } from 'app/config/input.constants';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AlertError } from 'app/shared/alert/alert-error.model';

@Component({
  selector: 'jhi-note-create',
  templateUrl: './note-create.component.html',
  styleUrls: ['../note.scss'],
  standalone: true,
  imports: [SharedModule, FormsModule, ReactiveFormsModule, ClickOutsideDirective, InputTextareaDirective, TagInputComponent],
})
export class NoteCreateComponent implements AfterViewInit, OnInit {
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
  readonly noteFormService = inject(NoteFormService);
  readonly noteCreateForm: NoteFormGroup = this.noteFormService.createNoteFormGroup();
  // ----- Alerts
  readonly titleValue = toSignal(this.noteCreateForm.controls.title.valueChanges, {
    initialValue: this.noteCreateForm.controls.title.value ?? '',
  });

  readonly contentValue = toSignal(this.noteCreateForm.controls.content.valueChanges, {
    initialValue: this.noteCreateForm.controls.content.value ?? '',
  });
  readonly titleLength = computed(() => (this.titleValue() ?? '').length);
  readonly contentLength = computed(() => (this.contentValue() ?? '').length);
  readonly titleRemaining = computed(() => this.maxTitleLength - this.titleLength());
  readonly contentRemaining = computed(() => this.maxContentLength - this.contentLength());
  readonly showTitleWarning = signal(true);
  readonly showContentWarning = signal(true);
  readonly shouldShowTitleWarning = computed(() => this.showTitleWarning() && this.titleRemaining() <= 100 && this.titleRemaining() >= 0);
  readonly shouldShowContentWarning = computed(
    () => this.showContentWarning() && this.contentRemaining() <= 500 && this.contentRemaining() >= 0,
  );
  // ----- View refs -----
  @ViewChild('tagInput') private readonly tagInput?: TagInputComponent;
  // ----- Injects
  private readonly dataUtils = inject(DataUtils);
  private readonly eventManager = inject(EventManager);
  private readonly noteService = inject(NoteService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  // ---- FORM
  // ----- Derived state -----

  constructor() {
    this.resetForm();
    this.noteCreateForm.controls.title.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.showTitleWarning.set(true);
    });

    this.noteCreateForm.controls.content.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.showContentWarning.set(true);
    });
  }

  ngOnInit(): void {
    this.loadRelationshipsOptions();
  }

  ngAfterViewInit(): void {
    const popup = this.tagInput?.inputForm?.popup;
    popup?.selectItem.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.selected.set(true);
      setTimeout(() => this.selected.set(false), 150);
    });
  }

  hasValue(): boolean {
    const title = (this.noteCreateForm.controls.title.value ?? '').trim();
    const content = (this.noteCreateForm.controls.content.value ?? '').trim();
    const alarmDate = this.noteCreateForm.controls.alarmDate.value;
    const alarmValid = !!alarmDate && dayjs(alarmDate, DATE_TIME_FORMAT, true).isValid();
    return title.length > 0 || content.length > 0 || alarmValid || (this.noteCreateForm.controls.tags.value?.length ?? 0) > 0;
  }

  canSubmit(): boolean {
    if (this.isSaving() || this.selected()) {
      return false;
    }
    const alarmOk = !this.noteCreateForm.controls.alarmDate.value || this.noteCreateForm.controls.alarmDate.valid;
    const otherOk =
      this.noteCreateForm.controls.status.valid && this.noteCreateForm.controls.title.valid && this.noteCreateForm.controls.content.valid;
    return this.hasValue() && otherOk && alarmOk;
  }
  // alerts
  dismissTitleWarning(): void {
    this.showTitleWarning.set(false);
  }

  dismissContentWarning(): void {
    this.showContentWarning.set(false);
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

  getSelectedUser(option: IUser, selectedVals?: IUser[] | null): IUser {
    return selectedVals?.find(v => v.id === option.id) ?? option;
  }
  // ----- Save flow -----
  save(): void {
    this.isSaving.set(true);
    const note = this.noteFormService.getNote(this.noteCreateForm);
    note.title = note.title?.trim() ?? null;
    note.content = note.content?.trim() ?? null;
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
  // ----- Form helpers -----
  private resetForm(): void {
    this.showTitleWarning.set(true);
    this.showContentWarning.set(true);
    this.noteFormService.resetForm(this.noteCreateForm, { id: null });
  }

  private loadRelationshipsOptions(): void {
    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(map((users: IUser[]) => this.userService.addUserToCollectionIfMissing<IUser>(users)))
      .subscribe((users: IUser[]) => this.usersSharedCollection.set(users));
  }
}
