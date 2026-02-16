import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { INote } from 'app/entities/note/note.model';
import { NoteService } from 'app/entities/note/service/note.service';
import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';
import { INoteAccess } from '../note-access.model';
import { NoteAccessService } from '../service/note-access.service';
import { NoteAccessFormService } from './note-access-form.service';

import { NoteAccessUpdateComponent } from './note-access-update.component';

describe('NoteAccess Management Update Component', () => {
  let comp: NoteAccessUpdateComponent;
  let fixture: ComponentFixture<NoteAccessUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let noteAccessFormService: NoteAccessFormService;
  let noteAccessService: NoteAccessService;
  let noteService: NoteService;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoteAccessUpdateComponent],
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
      .overrideTemplate(NoteAccessUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NoteAccessUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    noteAccessFormService = TestBed.inject(NoteAccessFormService);
    noteAccessService = TestBed.inject(NoteAccessService);
    noteService = TestBed.inject(NoteService);
    userService = TestBed.inject(UserService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Note query and add missing value', () => {
      const noteAccess: INoteAccess = { id: 9758 };
      const note: INote = { id: 1015 };
      noteAccess.note = note;

      const noteCollection: INote[] = [{ id: 1015 }];
      jest.spyOn(noteService, 'query').mockReturnValue(of(new HttpResponse({ body: noteCollection })));
      const additionalNotes = [note];
      const expectedCollection: INote[] = [...additionalNotes, ...noteCollection];
      jest.spyOn(noteService, 'addNoteToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ noteAccess });
      comp.ngOnInit();

      expect(noteService.query).toHaveBeenCalled();
      expect(noteService.addNoteToCollectionIfMissing).toHaveBeenCalledWith(
        noteCollection,
        ...additionalNotes.map(expect.objectContaining),
      );
      expect(comp.notesSharedCollection).toEqual(expectedCollection);
    });

    it('should call User query and add missing value', () => {
      const noteAccess: INoteAccess = { id: 9758 };
      const user: IUser = { id: 3944 };
      noteAccess.user = user;

      const userCollection: IUser[] = [{ id: 3944 }];
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: userCollection })));
      const additionalUsers = [user];
      const expectedCollection: IUser[] = [...additionalUsers, ...userCollection];
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ noteAccess });
      comp.ngOnInit();

      expect(userService.query).toHaveBeenCalled();
      expect(userService.addUserToCollectionIfMissing).toHaveBeenCalledWith(
        userCollection,
        ...additionalUsers.map(expect.objectContaining),
      );
      expect(comp.usersSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const noteAccess: INoteAccess = { id: 9758 };
      const note: INote = { id: 1015 };
      noteAccess.note = note;
      const user: IUser = { id: 3944 };
      noteAccess.user = user;

      activatedRoute.data = of({ noteAccess });
      comp.ngOnInit();

      expect(comp.notesSharedCollection).toContainEqual(note);
      expect(comp.usersSharedCollection).toContainEqual(user);
      expect(comp.noteAccess).toEqual(noteAccess);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INoteAccess>>();
      const noteAccess = { id: 26436 };
      jest.spyOn(noteAccessFormService, 'getNoteAccess').mockReturnValue(noteAccess);
      jest.spyOn(noteAccessService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ noteAccess });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: noteAccess }));
      saveSubject.complete();

      // THEN
      expect(noteAccessFormService.getNoteAccess).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(noteAccessService.update).toHaveBeenCalledWith(expect.objectContaining(noteAccess));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INoteAccess>>();
      const noteAccess = { id: 26436 };
      jest.spyOn(noteAccessFormService, 'getNoteAccess').mockReturnValue({ id: null });
      jest.spyOn(noteAccessService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ noteAccess: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: noteAccess }));
      saveSubject.complete();

      // THEN
      expect(noteAccessFormService.getNoteAccess).toHaveBeenCalled();
      expect(noteAccessService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INoteAccess>>();
      const noteAccess = { id: 26436 };
      jest.spyOn(noteAccessService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ noteAccess });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(noteAccessService.update).toHaveBeenCalled();
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

    describe('compareUser', () => {
      it('should forward to userService', () => {
        const entity = { id: 3944 };
        const entity2 = { id: 6275 };
        jest.spyOn(userService, 'compareUser');
        comp.compareUser(entity, entity2);
        expect(userService.compareUser).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
