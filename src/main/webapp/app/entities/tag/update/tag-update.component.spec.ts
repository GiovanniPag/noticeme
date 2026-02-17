import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';
import { INote } from 'app/entities/note/note.model';
import { NoteService } from 'app/entities/note/service/note.service';
import { ITag } from '../tag.model';
import { TagService } from '../service/tag.service';
import { TagFormService } from './tag-form.service';

import { TagUpdateComponent } from './tag-update.component';

describe('Tag Management Update Component', () => {
  let comp: TagUpdateComponent;
  let fixture: ComponentFixture<TagUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let tagFormService: TagFormService;
  let tagService: TagService;
  let userService: UserService;
  let noteService: NoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TagUpdateComponent],
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
      .overrideTemplate(TagUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(TagUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    tagFormService = TestBed.inject(TagFormService);
    tagService = TestBed.inject(TagService);
    userService = TestBed.inject(UserService);
    noteService = TestBed.inject(NoteService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call User query and add missing value', () => {
      const tag: ITag = { id: 16779 };
      const owner: IUser = { id: 3944 };
      tag.owner = owner;

      const userCollection: IUser[] = [{ id: 3944 }];
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: userCollection })));
      const additionalUsers = [owner];
      const expectedCollection: IUser[] = [...additionalUsers, ...userCollection];
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      expect(userService.query).toHaveBeenCalled();
      expect(userService.addUserToCollectionIfMissing).toHaveBeenCalledWith(
        userCollection,
        ...additionalUsers.map(expect.objectContaining),
      );
      expect(comp.usersSharedCollection).toEqual(expectedCollection);
    });

    it('should call Note query and add missing value', () => {
      const tag: ITag = { id: 16779 };
      const notes: INote[] = [{ id: 1015 }];
      tag.notes = notes;

      const noteCollection: INote[] = [{ id: 1015 }];
      jest.spyOn(noteService, 'query').mockReturnValue(of(new HttpResponse({ body: noteCollection })));
      const additionalNotes = [...notes];
      const expectedCollection: INote[] = [...additionalNotes, ...noteCollection];
      jest.spyOn(noteService, 'addNoteToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      expect(noteService.query).toHaveBeenCalled();
      expect(noteService.addNoteToCollectionIfMissing).toHaveBeenCalledWith(
        noteCollection,
        ...additionalNotes.map(expect.objectContaining),
      );
      expect(comp.notesSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const tag: ITag = { id: 16779 };
      const owner: IUser = { id: 3944 };
      tag.owner = owner;
      const notes: INote = { id: 1015 };
      tag.notes = [notes];

      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      expect(comp.usersSharedCollection).toContainEqual(owner);
      expect(comp.notesSharedCollection).toContainEqual(notes);
      expect(comp.tag).toEqual(tag);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITag>>();
      const tag = { id: 19931 };
      jest.spyOn(tagFormService, 'getTag').mockReturnValue(tag);
      jest.spyOn(tagService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: tag }));
      saveSubject.complete();

      // THEN
      expect(tagFormService.getTag).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(tagService.update).toHaveBeenCalledWith(expect.objectContaining(tag));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITag>>();
      const tag = { id: 19931 };
      jest.spyOn(tagFormService, 'getTag').mockReturnValue({ id: null });
      jest.spyOn(tagService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ tag: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: tag }));
      saveSubject.complete();

      // THEN
      expect(tagFormService.getTag).toHaveBeenCalled();
      expect(tagService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITag>>();
      const tag = { id: 19931 };
      jest.spyOn(tagService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(tagService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareUser', () => {
      it('should forward to userService', () => {
        const entity = { id: 3944 };
        const entity2 = { id: 6275 };
        jest.spyOn(userService, 'compareUser');
        comp.compareUser(entity, entity2);
        expect(userService.compareUser).toHaveBeenCalledWith(entity, entity2);
      });
    });

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
