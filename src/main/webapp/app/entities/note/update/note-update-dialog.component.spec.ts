import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { NoteUpdateDialogComponent } from './note-update-dialog.component';
import { NoteService } from '../service/note.service';
import { NoteFormService } from './note-form.service';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { ModalCloseReason } from 'app/entities/enumerations/modal-close-reason.model';

import { UserService } from 'app/entities/user/service/user.service';
import { AttachmentService } from 'app/entities/attachment/service/attachment.service';
import { AttachmentFormService } from 'app/entities/attachment/update/attachment-form.service';
import { DataUtils } from 'app/core/util/data-util.service';
import { EventManager } from 'app/core/util/event-manager.service';

import { INote } from '../note.model';
import { ITag } from 'app/entities/tag/tag.model';
import { IAttachment } from 'app/entities/attachment/attachment.model';
import dayjs from 'dayjs/esm';

describe('Note Management Update Component', () => {
  let comp: NoteUpdateDialogComponent;
  let fixture: ComponentFixture<NoteUpdateDialogComponent>;

  let noteService: NoteService;
  let noteFormService: NoteFormService;
  let userService: UserService;
  let attachmentService: AttachmentService;
  let attachmentFormService: AttachmentFormService;
  let dataUtils: DataUtils;
  let eventManager: EventManager;
  let activeModal: NgbActiveModal;
  let modalService: NgbModal;

  const createModalRef = (closedValue?: unknown): any =>
    ({
      componentInstance: {},
      closed: of(closedValue),
    }) as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoteUpdateDialogComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        NgbActiveModal,
        {
          provide: NgbModal,
          useValue: {
            open: jest.fn(),
          },
        },
      ],
    })
      .overrideTemplate(NoteUpdateDialogComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NoteUpdateDialogComponent);
    comp = fixture.componentInstance;

    noteService = TestBed.inject(NoteService);
    noteFormService = TestBed.inject(NoteFormService);
    userService = TestBed.inject(UserService);
    attachmentService = TestBed.inject(AttachmentService);
    attachmentFormService = TestBed.inject(AttachmentFormService);
    dataUtils = TestBed.inject(DataUtils);
    eventManager = TestBed.inject(EventManager);
    activeModal = TestBed.inject(NgbActiveModal);
    modalService = TestBed.inject(NgbModal);
  });

  describe('basic behavior', () => {
    it('should create', () => {
      expect(comp).toBeTruthy();
    });

    it('should close modal with given reason', () => {
      jest.spyOn(activeModal, 'close');
      comp.close('TEST_REASON');
      expect(activeModal.close).toHaveBeenCalledWith('TEST_REASON');
    });

    it('should expose initial defaults', () => {
      expect(comp.note).toBeNull();
      expect(comp.attachments()).toEqual([]);
      expect(comp.isSaving()).toBe(false);
      expect(comp.selected()).toBe(false);
      expect(comp.isDeleted()).toBe(false);
    });
  });
  describe('note setter/getter', () => {
    it('should set note, update form, load users and attachments when note exists', () => {
      const note: INote = {
        id: 123,
        title: 'My note',
        content: 'content',
        status: NoteStatus.NORMAL,
      };

      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));

      comp.note = note;

      expect(comp.note).toEqual(note);
      expect(userService.query).toHaveBeenCalled();
      expect(userService.addUserToCollectionIfMissing).toHaveBeenCalled();
      expect(attachmentService.query).toHaveBeenCalledWith({ noteId: 123 });
    });

    it('should clear attachments when note is null', () => {
      comp.attachments.set([{ id: 1 } as IAttachment]);

      comp.note = null;

      expect(comp.note).toBeNull();
      expect(comp.attachments()).toEqual([]);
    });

    it('should clear attachments when note has no id', () => {
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);

      comp.attachments.set([{ id: 1 } as IAttachment]);
      comp.note = {
        id: null,
        title: 'Draft',
        content: 'draft',
        status: NoteStatus.NORMAL,
      } as any;

      expect(comp.attachments()).toEqual([]);
    });
  });

  describe('computed helpers', () => {
    it('should report deleted state from note', () => {
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));

      comp.note = {
        id: 10,
        status: NoteStatus.DELETED,
      } as INote;

      expect(comp.isDeleted()).toBe(true);
    });

    it('should dismiss title warning', () => {
      expect((comp as any).showTitleWarning()).toBe(true);

      comp.dismissTitleWarning();

      expect((comp as any).showTitleWarning()).toBe(false);
    });

    it('should dismiss content warning', () => {
      expect((comp as any).showContentWarning()).toBe(true);

      comp.dismissContentWarning();

      expect((comp as any).showContentWarning()).toBe(false);
    });
  });

  describe('closeAndSaveNote', () => {
    it('should do nothing when selected is true', () => {
      jest.spyOn(comp, 'save');
      jest.spyOn(comp, 'close');

      comp.selected.set(true);

      comp.closeAndSaveNote();

      expect(comp.save).not.toHaveBeenCalled();
      expect(comp.close).not.toHaveBeenCalled();
    });

    it('should close when note is deleted', () => {
      jest.spyOn(comp, 'close');
      jest.spyOn(comp, 'save');

      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));

      comp.note = {
        id: 1,
        status: NoteStatus.DELETED,
      } as INote;

      comp.closeAndSaveNote();

      expect(comp.close).toHaveBeenCalledWith(ModalCloseReason.CLOSED);
      expect(comp.save).not.toHaveBeenCalled();
    });

    it('should save when canSubmit is true', () => {
      jest.spyOn(comp, 'save');
      jest.spyOn(comp, 'canSubmit').mockReturnValue(true);

      comp.closeAndSaveNote();

      expect(comp.save).toHaveBeenCalledWith(ModalCloseReason.MODIFIED);
    });

    it('should not save when canSubmit is false', () => {
      jest.spyOn(comp, 'save');
      jest.spyOn(comp, 'canSubmit').mockReturnValue(false);

      comp.closeAndSaveNote();

      expect(comp.save).not.toHaveBeenCalled();
    });
  });

  describe('savePatch', () => {
    it('should call partialUpdate for existing entity', () => {
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: 1015, title: 'A' } as INote;

      jest.spyOn(noteFormService, 'getNote').mockReturnValue(note);
      jest.spyOn(noteService, 'partialUpdate').mockReturnValue(saveSubject);
      jest.spyOn(comp as any, 'onSavePatchSuccess');

      comp.savePatch(undefined);

      expect(comp.isSaving()).toBe(true);
      expect(noteService.partialUpdate).toHaveBeenCalledWith(note);

      saveSubject.next(new HttpResponse({ body: note }));
      saveSubject.complete();

      expect((comp as any).onSavePatchSuccess).toHaveBeenCalled();
      expect(comp.note).toEqual(note);
      expect(comp.isSaving()).toBe(false);
    });

    it('should not call partialUpdate for new entity', () => {
      jest.spyOn(noteFormService, 'getNote').mockReturnValue({ id: null } as any);
      jest.spyOn(noteService, 'partialUpdate');

      comp.savePatch(undefined);

      expect(noteService.partialUpdate).not.toHaveBeenCalled();
      expect(comp.isSaving()).toBe(true);
    });

    it('should set isSaving false on patch error', () => {
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: 1015 } as INote;

      jest.spyOn(noteFormService, 'getNote').mockReturnValue(note);
      jest.spyOn(noteService, 'partialUpdate').mockReturnValue(saveSubject);
      jest.spyOn(comp as any, 'onSavePatchError');

      comp.savePatch(undefined);
      saveSubject.error('patch error');

      expect((comp as any).onSavePatchError).toHaveBeenCalled();
      expect(comp.isSaving()).toBe(false);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: 1015, title: 'Saved note' } as INote;

      jest.spyOn(noteFormService, 'getNote').mockReturnValue(note);
      jest.spyOn(noteService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'close');

      comp.save(ModalCloseReason.MODIFIED);

      expect(comp.isSaving()).toBe(true);
      expect(noteService.update).toHaveBeenCalledWith(note);

      saveSubject.next(new HttpResponse({ body: note }));
      saveSubject.complete();

      expect(comp.close).toHaveBeenCalledWith(ModalCloseReason.MODIFIED);
      expect(comp.isSaving()).toBe(false);
    });

    it('should call create service on save for new entity', () => {
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: null, title: 'New note' } as any;

      jest.spyOn(noteFormService, 'getNote').mockReturnValue(note);
      jest.spyOn(noteService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'close');

      comp.save(ModalCloseReason.MODIFIED);

      expect(comp.isSaving()).toBe(true);
      expect(noteService.create).toHaveBeenCalledWith(note);

      saveSubject.next(new HttpResponse({ body: { id: 33 } }));
      saveSubject.complete();

      expect(comp.close).toHaveBeenCalledWith(ModalCloseReason.MODIFIED);
      expect(comp.isSaving()).toBe(false);
    });

    it('should set isSaving to false on save error', () => {
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: 1015 } as INote;

      jest.spyOn(noteFormService, 'getNote').mockReturnValue(note);
      jest.spyOn(noteService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'close');

      comp.save(ModalCloseReason.MODIFIED);
      saveSubject.error('save error');

      expect(noteService.update).toHaveBeenCalledWith(note);
      expect(comp.close).not.toHaveBeenCalled();
      expect(comp.isSaving()).toBe(false);
    });
  });

  describe('status-changing actions', () => {
    it('should delete note', () => {
      jest.spyOn(comp, 'save');

      comp.deleteNote();

      expect((comp as any).editForm.controls.status.value).toBe(NoteStatus.DELETED);
      expect(comp.save).toHaveBeenCalledWith(ModalCloseReason.DELETED);
    });

    it('should undelete note', () => {
      jest.spyOn(comp, 'save');

      comp.unDeleteNote();

      expect((comp as any).editForm.controls.status.value).toBe(NoteStatus.NORMAL);
      expect(comp.save).toHaveBeenCalledWith(ModalCloseReason.UNDELETED);
    });

    it('should archive note', () => {
      jest.spyOn(comp, 'save');

      comp.archiveNote();

      expect((comp as any).editForm.controls.status.value).toBe(NoteStatus.ARCHIVED);
      expect(comp.save).toHaveBeenCalledWith(ModalCloseReason.ARCHIVED);
    });

    it('should unarchive note', () => {
      jest.spyOn(comp, 'save');

      comp.unArchiveNote();

      expect((comp as any).editForm.controls.status.value).toBe(NoteStatus.NORMAL);
      expect(comp.save).toHaveBeenCalledWith(ModalCloseReason.UNARCHIVED);
    });

    it('should unpin note', () => {
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));

      comp.note = {
        id: 1,
        status: NoteStatus.PINNED,
      } as INote;

      comp.unPinNote();

      expect(comp.note.status).toBe(NoteStatus.NORMAL);
      expect((comp as any).editForm.controls.status.value).toBe(NoteStatus.NORMAL);
    });

    it('should pin note', () => {
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));

      comp.note = {
        id: 1,
        status: NoteStatus.NORMAL,
      } as INote;

      comp.pinNote();

      expect(comp.note.status).toBe(NoteStatus.PINNED);
      expect((comp as any).editForm.controls.status.value).toBe(NoteStatus.PINNED);
    });

    it('should save with UNARCHIVED reason when pinning archived note', () => {
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(comp, 'save');

      comp.note = {
        id: 1,
        status: NoteStatus.ARCHIVED,
      } as INote;

      comp.pinNote();

      expect(comp.note.status).toBe(NoteStatus.PINNED);
      expect(comp.save).toHaveBeenCalledWith(ModalCloseReason.UNARCHIVED);
    });

    it('should do nothing on pinNote if note is null', () => {
      jest.spyOn(comp, 'save');

      comp.pinNote();

      expect(comp.save).not.toHaveBeenCalled();
    });
  });

  describe('date handling and canSubmit', () => {
    it('should reset alarmDate', () => {
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));

      comp.note = {
        id: 1,
        alarmDate: dayjs(),
      } as INote;

      (comp as any).editForm.controls.alarmDate.setValue('2026-03-10T10:00');

      comp.resetDate();

      expect((comp as any).editForm.controls.alarmDate.value).toBeNull();
      expect(comp.note.alarmDate).toBeUndefined();
    });

    it('should return false from canSubmit when isSaving is true', () => {
      comp.isSaving.set(true);

      expect(comp.canSubmit()).toBe(false);
    });

    it('should return true from canSubmit when form is valid', () => {
      (comp as any).editForm.patchValue({
        title: 'A valid title',
        content: 'Some content',
        status: NoteStatus.NORMAL,
        owner: { id: 1 },
      });

      expect(comp.canSubmit()).toBe(true);
    });
  });

  describe('tag changes', () => {
    it('should update note tags and save patch', () => {
      const tags: ITag[] = [{ id: 1 } as ITag, { id: 2 } as ITag];
      jest.spyOn(comp, 'savePatch');

      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));

      comp.note = {
        id: 1,
        tags: [],
        status: NoteStatus.NORMAL,
      } as INote;

      comp.modelChangeFn(tags);

      expect(comp.note.tags).toEqual(tags);
      expect(comp.savePatch).toHaveBeenCalledWith(undefined);
    });
  });

  describe('attachments', () => {
    it('should load attachments for note with id', () => {
      const body = [{ id: 9 } as IAttachment];
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body })));

      comp.note = {
        id: 9,
        status: NoteStatus.NORMAL,
      } as INote;

      expect(comp.attachments()).toEqual(body);
    });

    it('should add attachment on successful upload', () => {
      const attachment = { id: 2, fileName: 'a.png' } as IAttachment;

      comp.attachments.set([]);
      jest.spyOn(attachmentFormService, 'resetForm');

      (comp as any).onSaveAttachPatchSuccess(attachment);

      expect(comp.attachments()).toContain(attachment);
      expect(attachmentFormService.resetForm).toHaveBeenCalled();
    });

    it('should do nothing if uploaded attachment is null', () => {
      comp.attachments.set([{ id: 1 } as IAttachment]);
      jest.spyOn(attachmentFormService, 'resetForm');

      (comp as any).onSaveAttachPatchSuccess(null);

      expect(comp.attachments()).toEqual([{ id: 1 } as IAttachment]);
      expect(attachmentFormService.resetForm).not.toHaveBeenCalled();
    });

    it('should remove attachment after confirmed delete', fakeAsync(() => {
      const attachment = { id: 10 } as IAttachment;
      const otherAttachment = { id: 11 } as IAttachment;
      comp.attachments.set([attachment, otherAttachment]);
      const modalSvc = (comp as any).modalService;
      const closed$ = new Subject<string>();
      jest.spyOn(modalSvc, 'open').mockReturnValue({
        componentInstance: {},
        closed: closed$.asObservable(),
      } as any);
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: [] })));
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue([]);
      jest.spyOn(attachmentService, 'query').mockReturnValue(of(new HttpResponse({ body: [attachment, otherAttachment] })));

      comp.note = {
        id: 1,
        attachments: [attachment, otherAttachment],
        status: NoteStatus.NORMAL,
      } as INote;

      comp.deleteAttachment(attachment);
      closed$.next('deleted');
      tick();

      expect(comp.attachments()).toEqual([otherAttachment]);
      expect(comp.note.attachments).toEqual([otherAttachment]);
    }));

    it('should not remove attachment when delete modal closes with another reason', () => {
      const attachment = { id: 10 } as IAttachment;
      comp.attachments.set([attachment]);

      jest.spyOn(modalService, 'open').mockReturnValue(createModalRef('cancel'));

      comp.deleteAttachment(attachment);

      expect(comp.attachments()).toEqual([attachment]);
    });
  });

  describe('permanent delete', () => {
    it('should close modal when permanent delete is confirmed', fakeAsync(() => {
      const modalSvc = (comp as any).modalService;
      jest.spyOn(modalSvc, 'open').mockReturnValue({
        componentInstance: {},
        closed: of('deleted'),
      } as any);

      jest.spyOn(comp, 'close');

      comp.permanentDeleteNote();

      expect(comp.close).toHaveBeenCalledWith(ModalCloseReason.PERMANENTDELETED);
    }));

    it('should not close modal when permanent delete is cancelled', () => {
      const modalSvc = (comp as any).modalService;
      jest.spyOn(modalSvc, 'open').mockReturnValue({
        componentInstance: {},
        closed: of('cancel'),
      } as any);

      jest.spyOn(comp, 'close');

      comp.permanentDeleteNote();

      expect(comp.close).not.toHaveBeenCalled();
    });
  });

  describe('file utilities', () => {
    it('should delegate byteSize to DataUtils', () => {
      jest.spyOn(dataUtils, 'byteSize').mockReturnValue('123 bytes');

      const result = comp.byteSize('abc');

      expect(dataUtils.byteSize).toHaveBeenCalledWith('abc');
      expect(result).toBe('123 bytes');
    });

    it('should delegate openFile to DataUtils', () => {
      jest.spyOn(dataUtils, 'openFile').mockImplementation();

      comp.openFile('abc', 'text/plain');

      expect(dataUtils.openFile).toHaveBeenCalledWith('abc', 'text/plain');
    });

    it('should broadcast file load error', () => {
      const loadError = { key: 'not.image', message: 'bad file' } as any;
      const event = {
        target: {
          files: [{ name: 'bad.txt', size: 10 }],
        },
      } as unknown as Event;

      jest.spyOn(dataUtils, 'loadFileToForm').mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(loadError);
        }),
      );
      jest.spyOn(eventManager, 'broadcast');

      comp.setFileData(event, 'data', true);

      expect(eventManager.broadcast).toHaveBeenCalled();
    });
  });
});
