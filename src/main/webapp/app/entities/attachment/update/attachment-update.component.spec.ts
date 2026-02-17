import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { INote } from 'app/entities/note/note.model';
import { NoteService } from 'app/entities/note/service/note.service';
import { AttachmentService } from '../service/attachment.service';
import { IAttachment } from '../attachment.model';
import { AttachmentFormService } from './attachment-form.service';

import { AttachmentUpdateComponent } from './attachment-update.component';

describe('Attachment Management Update Component', () => {
  let comp: AttachmentUpdateComponent;
  let fixture: ComponentFixture<AttachmentUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let attachmentFormService: AttachmentFormService;
  let attachmentService: AttachmentService;
  let noteService: NoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AttachmentUpdateComponent],
      providers: [
        provideHttpClient(),
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(AttachmentUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(AttachmentUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    attachmentFormService = TestBed.inject(AttachmentFormService);
    attachmentService = TestBed.inject(AttachmentService);
    noteService = TestBed.inject(NoteService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Note query and add missing value', () => {
      const attachment: IAttachment = { id: 16801 };
      const note: INote = { id: 1015 };
      attachment.note = note;

      const noteCollection: INote[] = [{ id: 1015 }];
      jest.spyOn(noteService, 'query').mockReturnValue(of(new HttpResponse({ body: noteCollection })));
      const additionalNotes = [note];
      const expectedCollection: INote[] = [...additionalNotes, ...noteCollection];
      jest.spyOn(noteService, 'addNoteToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ attachment });
      comp.ngOnInit();

      expect(noteService.query).toHaveBeenCalled();
      expect(noteService.addNoteToCollectionIfMissing).toHaveBeenCalledWith(
        noteCollection,
        ...additionalNotes.map(expect.objectContaining),
      );
      expect(comp.notesSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const attachment: IAttachment = { id: 16801 };
      const note: INote = { id: 1015 };
      attachment.note = note;

      activatedRoute.data = of({ attachment });
      comp.ngOnInit();

      expect(comp.notesSharedCollection).toContainEqual(note);
      expect(comp.attachment).toEqual(attachment);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IAttachment>>();
      const attachment = { id: 8078 };
      jest.spyOn(attachmentFormService, 'getAttachment').mockReturnValue(attachment);
      jest.spyOn(attachmentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ attachment });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: attachment }));
      saveSubject.complete();

      // THEN
      expect(attachmentFormService.getAttachment).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(attachmentService.update).toHaveBeenCalledWith(expect.objectContaining(attachment));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IAttachment>>();
      const attachment = { id: 8078 };
      jest.spyOn(attachmentFormService, 'getAttachment').mockReturnValue({ id: null });
      jest.spyOn(attachmentService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ attachment: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: attachment }));
      saveSubject.complete();

      // THEN
      expect(attachmentFormService.getAttachment).toHaveBeenCalled();
      expect(attachmentService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IAttachment>>();
      const attachment = { id: 8078 };
      jest.spyOn(attachmentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ attachment });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(attachmentService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareNote', () => {
      it('should forward to noteService', () => {
        const entity = { id: 1015 };
        const entity2 = { id: 14975 };
        jest.spyOn(noteService, 'compareNote');
        comp.compareNote(entity, entity2);
        expect(noteService.compareNote).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
