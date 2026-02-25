import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';

import { INote, Note } from '../note.model';
import { ITag } from 'app/entities/tag/tag.model';
import { IUser } from 'app/entities/user/user.model';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { AlertService, Alert } from 'app/core/util/alert.service';

import { DATE_TIME_FORMAT, DATE_TIME_INPUT_FORMAT } from 'app/config/input.constants';
import { UserService } from 'app/entities/user/user.service';
import { NoteService } from '../service/note.service';
import { FormBuilder, Validators } from '@angular/forms';
import * as dayjs from 'dayjs';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { MinDateValidator } from 'app/shared/date/MinDateValidator.directive';
import { TagInputComponent } from 'app/entities/tag/tag-chips/tag-input/tag-input.component';

@Component({
  selector: 'jhi-note-create',
  templateUrl: './note-create.component.html',
  styleUrls: ['../note.scss'],
})
export class NoteCreateComponent implements OnInit, AfterViewInit {
  /**
   * @name onSubmit
   */
  @Output() public oncreate: EventEmitter<INote> = new EventEmitter();

  @ViewChild('field_title') titleText!: ElementRef;
  @ViewChild('field_content') contentText!: ElementRef;
  @ViewChild('tagInput') tagInput!: TagInputComponent;

  owner: IUser | undefined;
  tags: ITag[] = [];
  status = NoteStatus.NORMAL;
  allNoteStatus = NoteStatus;

  usersSharedCollection: IUser[] = [];

  maxTagLength = 50;
  maxTitleLength = 255;
  maxContentLength = 20000;
  minDate = dayjs().format(DATE_TIME_INPUT_FORMAT);

  createForm = this.fb.group({
    title: [null, [Validators.maxLength(255)]],
    content: [null, [Validators.maxLength(20000)]],
    alarmDate: [null, [MinDateValidator(this.minDate)]],
    status: [null, [Validators.required]],
    tags: [],
    collaborators: [],
  });

  private alertMaxTitle?: Alert;
  private alertMaxContent?: Alert;
  private alerts: Alert[] = [];

  private isSaving = false;
  private selected = false;

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected noteService: NoteService,
    protected userService: UserService,
    protected fb: FormBuilder,
    protected alertService: AlertService
  ) {
    this.userService.getCurrent().subscribe((data: HttpResponse<IUser>) => (data.body ? (this.owner = data.body) : null));
  }

  ngAfterViewInit(): void {
    this.tagInput.inputForm!.popup.selectItem.subscribe(() => {
      this.selected = true;
      setTimeout(() => (this.selected = false), 10);
    });
  }

  ngOnInit(): void {
    this.alerts = this.alertService.get();
    this.resetForm();

    this.usersSharedCollection = this.userService.addUserToCollectionIfMissing(this.usersSharedCollection);

    this.alertMaxTitle = this.checkInputLenght(
      100,
      'warning.titlelength',
      this.createForm.get(['title'])!.value.length ?? 0,
      this.maxTitleLength,
      this.alertMaxTitle
    );
    this.alertMaxContent = this.checkInputLenght(
      500,
      'warning.contentlength',
      this.createForm.get(['content'])!.value.length ?? 0,
      this.maxContentLength,
      this.alertMaxContent
    );

    this.loadRelationshipsOptions();
  }

  closeAndSaveNote(): void {
    if (this.canSubmit()) {
      this.save();
    }
  }

  addWarningAlert(translationKey?: string, translationParams?: { [key: string]: unknown }): Alert {
    return this.alertService.addAlert({ type: 'warning', timeout: 0, translationKey, translationParams }, this.alerts);
  }

  checkInputLenght(
    limit: number,
    translationKey: string,
    currentLenght: number,
    maxLenght: number,
    alertToDisplay: Alert | undefined
  ): Alert | undefined {
    const remainingChar = maxLenght - currentLenght >= 0 ? maxLenght - currentLenght : 0;
    if (remainingChar <= limit) {
      if (!alertToDisplay || alertToDisplay.closed === true) {
        alertToDisplay = this.addWarningAlert(translationKey, { remainingCharachters: remainingChar });
      } else {
        alertToDisplay.translationParams!.remainingCharachters = remainingChar;
        this.alertService.translateDynamicMessage(alertToDisplay);
      }
    } else {
      if (alertToDisplay?.closed === false) {
        alertToDisplay.close?.(this.alerts);
      }
    }
    return alertToDisplay;
  }

  pushAlert(elem: HTMLInputElement | undefined): void {
    if (elem && elem === this.titleText.nativeElement) {
      this.alertMaxTitle = this.checkInputLenght(100, 'warning.titlelength', elem.value.length, this.maxTitleLength, this.alertMaxTitle);
    }
    if (elem && elem === this.contentText.nativeElement) {
      this.alertMaxContent = this.checkInputLenght(
        500,
        'warning.contentlength',
        elem.value.length,
        this.maxContentLength,
        this.alertMaxContent
      );
    }
  }

  save(): void {
    this.isSaving = true;
    const note = this.createFromForm();
    if (note.id === undefined) {
      this.subscribeToSaveResponse(this.noteService.create(note));
    }
  }

  getSelectedUser(option: IUser, selectedVals?: IUser[]): IUser {
    if (selectedVals) {
      for (const selectedVal of selectedVals) {
        if (option.id === selectedVal.id) {
          return selectedVal;
        }
      }
    }
    return option;
  }

  trackUserById(index: number, item: IUser): number {
    return item.id!;
  }

  resetForm(): void {
    if (this.alertMaxTitle?.closed === false) {
      this.alertMaxTitle.close?.(this.alerts);
    }
    if (this.alertMaxContent?.closed === false) {
      this.alertMaxContent.close?.(this.alerts);
    }
    this.emptyForm();
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  setFileData(event: Event, field: string, isImage: boolean): void {
    this.dataUtils.loadFileToForm(event, this.createForm, field, isImage).subscribe({
      error: (err: FileLoadError) =>
        this.eventManager.broadcast(
          new EventWithContent<AlertError>('noticeMeApp.error', { ...err, key: 'error.file.' + err.key })
        ),
    });
  }

  unPinNote(): void {
    this.status = NoteStatus.NORMAL;
    this.createForm.patchValue({ status: NoteStatus.NORMAL });
  }

  pinNote(): void {
    this.status = NoteStatus.PINNED;
    this.createForm.patchValue({ status: NoteStatus.PINNED });
  }

  canSubmit(): boolean {
    return (
      (this.createForm.valid ||
        (this.createForm.get('alarmDate')!.invalid &&
          this.createForm.get('status')!.valid &&
          this.createForm.get('title')!.valid &&
          this.createForm.get('content')!.valid &&
          this.createForm.get('owner')!.valid)) &&
      !this.isSaving &&
      !this.selected &&
      this.hasValue()
    );
  }

  hasValue(): boolean {
    return (
      this.createForm.get(['title'])!.value.trim().length > 0 ||
      this.createForm.get(['content'])!.value.trim().length > 0 ||
      dayjs(this.createForm.get(['alarmDate'])!.value, DATE_TIME_FORMAT).isValid() ||
      this.tags.length > 0
    );
  }

  resetDate(): void {
    this.createForm.get('alarmDate')!.reset();
  }

  public modelChangeFn($event: ITag[]): void {
    this.tags = $event;
    this.createForm.patchValue({ tags: this.tags });
  }

  protected onSaveSuccess(newNote: INote): void {
    this.oncreate.emit(newNote);
    this.resetForm();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<INote>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe(
      data => (data.body ? this.onSaveSuccess(data.body) : this.onSaveError()),
      () => this.onSaveError()
    );
  }

  protected emptyForm(): void {
    this.tags = [];
    this.status = NoteStatus.NORMAL;
    this.createForm.patchValue({
      title: '',
      content: '',
      alarmDate: null,
      status: this.status,
      tags: this.tags,
      collaborators: null,
    });
  }

  protected loadRelationshipsOptions(): void {
    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(
        map((users: IUser[]) =>
          this.userService.addUserToCollectionIfMissing(users, ...(this.createForm.get('collaborators')!.value ?? []))
        )
      )
      .subscribe((users: IUser[]) => (this.usersSharedCollection = users));
  }

  protected createFromForm(): INote {
    if (this.createForm.get(['tags'])!.value !== this.tags) {
      this.createForm.patchValue({ tags: this.tags });
    }
    return {
      ...new Note(),
      title: this.createForm.get(['title'])!.value,
      content: this.createForm.get(['content'])!.value,
      lastUpdateDate: dayjs(dayjs(), DATE_TIME_FORMAT),
      alarmDate: this.createForm.get(['alarmDate'])!.valid ? dayjs(this.createForm.get(['alarmDate'])!.value, DATE_TIME_FORMAT) : undefined,
      status: this.createForm.get(['status'])!.value,
      owner: this.owner,
      tags: this.createForm.get(['tags'])!.value ?? [],
      collaborators: this.createForm.get(['collaborators'])!.value,
    };
  }
}
