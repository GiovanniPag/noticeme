import {
  Component,
  ElementRef,
  DestroyRef,
  ViewChild,
  AfterViewInit,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import dayjs from 'dayjs/esm';
import { finalize, map } from 'rxjs/operators';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ClickOutsideDirective } from 'app/shared/outside/click-outside.directive';
import { InputTextareaDirective } from 'app/shared/autosize/autotextarea.directive';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { AlertService, Alert } from 'app/core/util/alert.service';
import { AlertError } from 'app/shared/alert/alert-error.model';

import { DATE_FORMAT, DATE_TIME_INPUT_FORMAT, TIME_FORMAT } from 'app/config/input.constants';

import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';

import { ITag } from 'app/entities/tag/tag.model';
import { TagInputComponent } from 'app/entities/tag/tag-chips/tag-input/tag-input.component';

import { INote, NewNote } from '../note.model';
import { NoteService } from '../service/note.service';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { NoteFormGroup, NoteFormService } from './note-form.service';
import { NoteDeleteDialogComponent } from '../delete/note-delete-dialog.component';

import { IAttachment, NewAttachment } from 'app/entities/attachment/attachment.model';
import { AttachmentService } from 'app/entities/attachment/service/attachment.service';
import { AttachmentFormGroup, AttachmentFormService } from 'app/entities/attachment/update/attachment-form.service';
import { AttachmentDeleteDialogComponent } from 'app/entities/attachment/delete/attachment-delete-dialog.component';
import { jhiCarouselComponent } from 'app/entities/attachment/carousel/carousel.component';

import { ModalCloseReason } from 'app/entities/enumerations/modal-close-reason.model';

@Component({
  selector: 'jhi-note-update-dialog',
  standalone: true,
  templateUrl: './note-update-dialog.component.html',
  styleUrl: '../note.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    TagInputComponent,
    jhiCarouselComponent,
    ClickOutsideDirective,
    InputTextareaDirective,
  ],
})
export class NoteUpdateDialogComponent implements AfterViewInit {
  @ViewChild('field_title') titleText?: ElementRef<HTMLInputElement>;
  @ViewChild('field_content') contentText?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('tagInput') tagInput?: TagInputComponent;
  @ViewChild('carousel') attachmentCarousel?: jhiCarouselComponent;

  usersSharedCollection: IUser[] = [];

  readonly noteSignal = signal<INote | null>(null);
  readonly allNoteStatus = NoteStatus;
  readonly noteState = this.noteSignal.asReadonly();
  set note(value: INote | null | undefined) {
    this.noteSignal.set(value ?? null);
    if (value) {
      this.updateForm(value);
      this.loadRelationshipsOptions();
      this.loadAttachments();
    }
  }

  get note(): INote | null {
    return this.noteSignal();
  }

  readonly attachments = signal<IAttachment[]>([]);

  readonly isSaving = signal(false);
  readonly selected = signal(false);
  readonly isDeleted = computed(() => this.noteState()?.status === NoteStatus.DELETED);
  readonly maxTitleLength = 255;
  readonly maxContentLength = 20000;
  readonly minDate = dayjs().format(DATE_TIME_INPUT_FORMAT);
  readonly formattedLastUpdateDate = computed(() => {
    const note = this.noteState();
    if (!note?.lastModifiedDate) {
      return '';
    }
    const lastModified = dayjs(note.lastModifiedDate);
    const today = dayjs().startOf('day');
    return lastModified.isAfter(today) ? `: ${lastModified.format(TIME_FORMAT)}` : `: ${lastModified.format(DATE_FORMAT)}`;
  });

  protected readonly destroyRef = inject(DestroyRef);
  protected readonly dataUtils = inject(DataUtils);
  protected readonly modalService = inject(NgbModal);
  protected readonly activeModal = inject(NgbActiveModal);
  protected readonly eventManager = inject(EventManager);
  protected readonly noteService = inject(NoteService);
  protected readonly userService = inject(UserService);
  protected readonly alertService = inject(AlertService);
  protected readonly attachmentService = inject(AttachmentService);
  protected readonly noteFormService = inject(NoteFormService);
  protected readonly attachmentFormService = inject(AttachmentFormService);

  protected editForm: NoteFormGroup = this.noteFormService.createNoteFormGroup();
  protected attachForm: AttachmentFormGroup = this.attachmentFormService.createAttachmentFormGroup();

  private alertMaxTitle?: Alert;
  private alertMaxContent?: Alert;
  private alerts: Alert[] = [];

  constructor() {
    this.alerts = this.alertService.get();
    effect(() => {
      const deleted = this.isDeleted();
      if (deleted) {
        this.editForm.disable({ emitEvent: false });
      } else {
        this.editForm.enable({ emitEvent: false });
      }
    });
  }

  ngAfterViewInit(): void {
    const popup = this.tagInput?.inputForm?.popup;
    if (!popup?.selectItem) {
      return;
    }
    popup.selectItem.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.selected.set(true);
      setTimeout(() => this.selected.set(false), 10);
    });
  }

  closeAndSaveNote(): void {
    if (this.selected()) {
      return;
    }

    if (this.isDeleted()) {
      this.close(ModalCloseReason.CLOSED);
      return;
    }

    if (this.canSubmit()) {
      this.save(ModalCloseReason.MODIFIED);
    }
  }

  savePatch(event: Event | undefined): void {
    this.isSaving.set(true);
    this.pushAlert(event?.target as HTMLInputElement | HTMLTextAreaElement | undefined);
    const note = this.getNoteToPersist();
    // todo if alarm date is not valid call resetdate
    if (note.id !== null) {
      this.subscribeToSavePatchResponse(this.noteService.partialUpdate(note), note);
    }
  }

  save(reason: string): void {
    this.isSaving.set(true);
    const note = this.getNoteToPersist();
    // todo if alarm date is not valid call resetdate
    if (note.id !== null) {
      this.subscribeToSaveResponse(this.noteService.update(note), reason);
    } else {
      this.subscribeToSaveResponse(this.noteService.create(note), reason);
    }
  }

  close(reason: string): void {
    this.closeAlert(this.alertMaxTitle);
    this.closeAlert(this.alertMaxContent);
    this.activeModal.close(reason);
  }

  deleteNote(): void {
    this.editForm.patchValue({ status: NoteStatus.DELETED });
    this.save(ModalCloseReason.DELETED);
  }

  unDeleteNote(): void {
    this.editForm.patchValue({ status: NoteStatus.NORMAL });
    this.save(ModalCloseReason.UNDELETED);
  }

  permanentDeleteNote(): void {
    const modalRef = this.modalService.open(NoteDeleteDialogComponent, {
      size: 'lg',
      centered: true,
      backdropClass: 'click-outside-exclude',
      windowClass: 'click-outside-exclude',
    });
    modalRef.componentInstance.note = this.note;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(reason => {
      if (reason === 'deleted') {
        this.close(ModalCloseReason.PERMANENTDELETED);
      }
    });
  }

  archiveNote(): void {
    this.editForm.patchValue({ status: NoteStatus.ARCHIVED });
    this.save(ModalCloseReason.ARCHIVED);
  }

  unPinNote(): void {
    this.noteSignal.update(current => (current ? { ...current, status: NoteStatus.NORMAL } : current));
    this.editForm.patchValue({ status: NoteStatus.NORMAL });
  }

  pinNote(): void {
    const note = this.noteState();
    if (!note) {
      return;
    }
    const initialStatus = note.status;
    this.noteSignal.update(current => (current ? { ...current, status: NoteStatus.PINNED } : current));
    this.editForm.patchValue({ status: NoteStatus.PINNED });
    if (initialStatus === NoteStatus.ARCHIVED) {
      this.save(ModalCloseReason.UNARCHIVED);
    }
  }

  unArchiveNote(): void {
    this.editForm.patchValue({ status: NoteStatus.NORMAL });
    this.save(ModalCloseReason.UNARCHIVED);
  }

  resetDate(): void {
    this.editForm.controls.alarmDate.reset();
    this.noteSignal.update(current => (current ? { ...current, alarmDate: undefined } : current));
  }

  canSubmit(): boolean {
    const form = this.editForm;
    const validExceptAlarmDate =
      form.controls.status.valid &&
      form.controls.title.valid &&
      form.controls.content.valid &&
      form.controls.owner.valid &&
      form.controls.alarmDate.invalid;
    return (form.valid || validExceptAlarmDate) && !this.isSaving();
  }

  modelChangeFn(tags: ITag[]): void {
    this.noteSignal.update(current => (current ? { ...current, tags } : current));
    this.savePatch(undefined);
  }

  deleteAttachment(attachment: IAttachment): void {
    const modalRef = this.modalService.open(AttachmentDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.attachment = attachment;

    modalRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(reason => {
      if (reason === 'deleted') {
        this.attachments.update(current => current.filter(item => item.id !== attachment.id));
        this.noteSignal.update(current =>
          current
            ? {
                ...current,
                attachments: (current.attachments ?? []).filter(item => item.id !== attachment.id),
              }
            : current,
        );
      }
    });
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  setFileData(event: Event, field: string, isImage: boolean): void {
    this.dataUtils.loadFileToForm(event, this.attachForm, field, isImage).subscribe({
      next: () => {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];
        this.attachForm.patchValue({
          fileName: file?.name ?? null,
          fileSize: file?.size ?? null,
          note: this.noteState(),
        });
        this.isSaving.set(true);
        const attachment = this.attachmentFormService.getAttachment(this.attachForm);
        this.subscribeToAttachSaveResponse(this.attachmentService.create(attachment as NewAttachment));
      },
      error: (err: FileLoadError) => {
        this.eventManager.broadcast(new EventWithContent<AlertError>('noticeMeApp.error', { ...err, key: 'error.file.' + err.key }));
      },
    });
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<INote>>, reason: string): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(reason),
      error: () => this.onSaveError(),
    });
  }

  protected subscribeToSavePatchResponse(result: Observable<HttpResponse<INote>>, note: INote): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => {
        this.onSavePatchSuccess();
        this.noteSignal.set(note);
      },
      error: () => this.onSavePatchError(),
    });
  }

  protected subscribeToAttachSaveResponse(result: Observable<HttpResponse<IAttachment>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: (res: HttpResponse<IAttachment>) => this.onSaveAttachPatchSuccess(res.body),
      error: () => this.onSavePatchError(),
    });
  }

  protected onSaveSuccess(reason: string): void {
    this.close(reason);
  }

  protected onSaveError(): void {
    // API for inheritance
  }

  protected onSavePatchSuccess(): void {
    // API for inheritance
  }

  protected onSavePatchError(): void {
    // API for inheritance
  }

  protected onSaveFinalize(): void {
    this.isSaving.set(false);
  }

  protected onSaveAttachPatchSuccess(toAdd: IAttachment | null): void {
    if (!toAdd) {
      return;
    }
    this.attachments.update(current => [...current, toAdd]);
    this.noteSignal.update(current =>
      current
        ? {
            ...current,
            attachments: [...(current.attachments ?? []), toAdd],
          }
        : current,
    );
    this.attachmentFormService.resetForm(this.attachForm, {
      id: null,
      fileName: null,
      data: null,
      dataContentType: null,
      fileSize: null,
      note: this.noteState(),
    });
  }

  protected updateForm(note: INote): void {
    this.noteFormService.resetForm(this.editForm, note);
    this.attachmentFormService.resetForm(this.attachForm, {
      id: null,
      fileName: null,
      data: null,
      dataContentType: null,
      fileSize: null,
      note: this.noteState(),
    });

    this.alertMaxTitle = this.checkInputLength(
      100,
      'warning.titlelength',
      note.title?.length ?? 0,
      this.maxTitleLength,
      this.alertMaxTitle,
    );

    this.alertMaxContent = this.checkInputLength(
      500,
      'warning.contentlength',
      note.content?.length ?? 0,
      this.maxContentLength,
      this.alertMaxContent,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(map((users: IUser[]) => this.userService.addUserToCollectionIfMissing<IUser>(users, this.note?.owner)))
      .subscribe((users: IUser[]) => (this.usersSharedCollection = users));
  }

  protected loadAttachments(): void {
    const note = this.noteState();
    if (!note?.id) {
      this.attachments.set([]);
      return;
    }

    this.attachmentService.query({ noteId: note.id }).subscribe((res: HttpResponse<IAttachment[]>) => {
      this.attachments.set(res.body ?? []);
    });
  }

  private addWarningAlert(translationKey?: string, translationParams?: Record<string, unknown>): Alert {
    const alert = this.alertService.addAlert({ type: 'warning', timeout: 0, translationKey, translationParams }, this.alerts);
    return alert;
  }

  private checkInputLength(
    limit: number,
    translationKey: string,
    currentLength: number,
    maxLength: number,
    alertToDisplay: Alert | undefined,
  ): Alert | undefined {
    const remainingCharacters = Math.max(maxLength - currentLength, 0);

    if (remainingCharacters <= limit) {
      if (!alertToDisplay || alertToDisplay.closed === true) {
        return this.addWarningAlert(translationKey, { remainingCharachters: remainingCharacters });
      }
      alertToDisplay.translationParams!.remainingCharachters = remainingCharacters;
      this.alertService.translateDynamicMessage(alertToDisplay);
      return alertToDisplay;
    }

    if (alertToDisplay?.closed === false) {
      alertToDisplay.close?.(this.alerts);
    }
    return alertToDisplay;
  }

  private pushAlert(elem: HTMLInputElement | HTMLTextAreaElement | undefined): void {
    if (!elem) {
      return;
    }
    if (elem === this.titleText?.nativeElement) {
      this.alertMaxTitle = this.checkInputLength(100, 'warning.titlelength', elem.value.length, this.maxTitleLength, this.alertMaxTitle);
    }
    if (elem === this.contentText?.nativeElement) {
      this.alertMaxContent = this.checkInputLength(
        500,
        'warning.contentlength',
        elem.value.length,
        this.maxContentLength,
        this.alertMaxContent,
      );
    }
  }

  private closeAlert(alert: Alert | undefined): void {
    if (alert?.closed === false) {
      alert.close?.(this.alerts);
    }
  }

  private getNoteToPersist(): INote | NewNote {
    if (this.editForm.controls.alarmDate.invalid) {
      this.resetDate();
    }

    return this.noteFormService.getNote(this.editForm);
  }
}
