/* eslint-disable prettier/prettier */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpHeaders, HttpResponse, provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import dayjs from 'dayjs/esm';

import { DEFAULT_SORT_DATA, ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { ModalCloseReason } from 'app/entities/enumerations/modal-close-reason.model';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { ParseLinks } from 'app/core/util/parse-links.service';
import { DataUtils } from 'app/core/util/data-util.service';
import { TranslateService } from '@ngx-translate/core';

import { sampleWithRequiredData } from '../note.test-samples';
import { NoteService } from '../service/note.service';
import { NoteComponent } from './note.component';
import { INote } from '../note.model';
import { ITag } from 'app/entities/tag/tag.model';

describe('NoteComponent', () => {
  let comp: NoteComponent;
  let fixture: ComponentFixture<NoteComponent>;
  let noteService: NoteService;
  let parseLinks: ParseLinks;
  let dataUtils: DataUtils;
  let modalService: NgbModal;
  let translateService: TranslateService;

  let queryParamMapSubject: BehaviorSubject<any>;
  let routeDataSubject: BehaviorSubject<any>;

  const createResponse = (body: INote[], link?: string): HttpResponse<INote[]> =>
    new HttpResponse({
      body,
      headers: new HttpHeaders(link ? { link } : {}),
    });

  beforeEach(async () => {
    queryParamMapSubject = new BehaviorSubject(
      convertToParamMap({
        sort: 'id,desc',
      }),
    );

    routeDataSubject = new BehaviorSubject({
      [DEFAULT_SORT_DATA]: 'id,asc',
    });

    await TestBed.configureTestingModule({
      imports: [
		NoteComponent,
		TranslateModule.forRoot(),],
      providers: [
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMapSubject.asObservable(),
            data: routeDataSubject.asObservable(),
            snapshot: {
              queryParamMap: queryParamMapSubject.value,
              queryParams: {},
            },
          },
        },
      ],
    })
      .overrideTemplate(NoteComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NoteComponent);
    comp = fixture.componentInstance;

    noteService = TestBed.inject(NoteService);
    parseLinks = TestBed.inject(ParseLinks);
    dataUtils = TestBed.inject(DataUtils);
    modalService = TestBed.inject(NgbModal);
    translateService = TestBed.inject(TranslateService);
  });

  describe('ngOnInit / initial loading', () => {
    it('should load notes on init and split pinned vs other', () => {
      jest
        .spyOn(noteService, 'query')
        .mockReturnValue(
          of(createResponse([{ id: 1015, status: NoteStatus.PINNED } as INote, { id: 14975, status: NoteStatus.NORMAL } as INote])),
        );

      comp.ngOnInit();

      expect(noteService.query).toHaveBeenCalled();
      expect(comp.pinnedNotes()).toEqual([expect.objectContaining({ id: 1015 })]);
      expect(comp.otherNotes()).toEqual([expect.objectContaining({ id: 14975 })]);
    });

    it('should read route params into component signals', () => {
      jest.spyOn(noteService, 'query').mockReturnValue(of(createResponse([])));

      queryParamMapSubject.next(
        convertToParamMap({
          sort: 'id,desc',
          status: NoteStatus.ARCHIVED,
          isCollaborator: 'true',
          hasAlarm: 'true',
          editNoteId: '123',
        }),
      );

      comp.ngOnInit();

      expect(comp.status()).toBe(NoteStatus.ARCHIVED);
      expect(comp.collab()).toBe(true);
      expect(comp.alarm()).toBe(true);
      expect(comp.pendingEditNoteId()).toBe(123);
    });

    it('should query with sort on first fetch', () => {
      jest.spyOn(noteService, 'query').mockReturnValue(of(createResponse([])));

      comp.ngOnInit();

      expect(noteService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          size: comp.itemsPerPage,
          sort: ['id,desc'],
          eagerload: true,
        }),
      );
    });
  });

  describe('trackId', () => {
    it('should forward to noteService', () => {
      const entity = { id: 1015 } as INote;
      jest.spyOn(noteService, 'getNoteIdentifier').mockReturnValue(1015);

      const id = comp.trackId(entity);

      expect(noteService.getNoteIdentifier).toHaveBeenCalledWith(entity);
      expect(id).toBe(1015);
    });
  });

  describe('navigation', () => {
    it('should navigate with sort attribute', () => {
      const navigateSpy = jest.spyOn(comp.router, 'navigate').mockResolvedValue(true);

      comp.navigateToWithComponentValues({ predicate: 'title', order: 'asc' });

      expect(navigateSpy).toHaveBeenCalledWith(
        ['./'],
        expect.objectContaining({
          relativeTo: expect.anything(),
          queryParams: {
            sort: ['title,asc'],
          },
        }),
      );
    });

    it('should clear links on navigation', () => {
      jest.spyOn(comp.router, 'navigate').mockResolvedValue(true);
      comp.links.set({ next: { page: '2' } });

      comp.navigateToWithComponentValues({ predicate: 'id', order: 'desc' });

      expect(comp.links()).toEqual({});
    });
  });

  describe('loading / pagination', () => {
    it('should load next pages using parsed link params', () => {
      jest
        .spyOn(noteService, 'query')
        .mockReturnValueOnce(
          of(createResponse([{ id: 1015, status: NoteStatus.NORMAL } as INote], '<http://localhost/api/notes?page=1&size=20>; rel="next"')),
        )
        .mockReturnValueOnce(
          of(
            createResponse(
              [{ id: 14975, status: NoteStatus.NORMAL } as INote],
              '<http://localhost/api/notes?page=0&size=20>; rel="prev",<http://localhost/api/notes?page=2&size=20>; rel="next"',
            ),
          ),
        );

      comp.ngOnInit();
      comp.loadNextPage();

      expect(noteService.query).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          page: '1',
        }),
      );
      expect(comp.otherNotes()).toEqual([expect.objectContaining({ id: 1015 }), expect.objectContaining({ id: 14975 })]);
    });

    it('should set links from response headers', () => {
      jest
        .spyOn(noteService, 'query')
        .mockReturnValue(
          of(createResponse([{ id: 1, status: NoteStatus.NORMAL } as INote], '<http://localhost/api/notes?page=1&size=20>; rel="next"')),
        );

      comp.load();

      expect(comp.hasMorePage()).toBe(true);
    });

    it('should reset collections and load again', () => {
      const loadSpy = jest.spyOn(comp, 'load').mockImplementation();

      comp.pinnedNotes.set([{ id: 1 } as INote]);
      comp.otherNotes.set([{ id: 2 } as INote]);

      comp.reset();

      expect(comp.pinnedNotes()).toEqual([]);
      expect(comp.otherNotes()).toEqual([]);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should set isLoading during queryBackend', () => {
      const subject = new Subject<HttpResponse<INote[]>>();
      jest.spyOn(noteService, 'query').mockReturnValue(subject);

      comp.load();

      expect(comp.isLoading()).toBe(true);

      subject.next(createResponse([]));
      subject.complete();

      expect(comp.isLoading()).toBe(false);
    });
  });

  describe('loadOne / updateNote', () => {
    it('should load one note and update existing pinned note in place', () => {
      comp.pinnedNotes.set([{ id: 1, status: NoteStatus.PINNED, title: 'old' } as INote]);
      jest
        .spyOn(noteService, 'find')
        .mockReturnValue(of(new HttpResponse({ body: { id: 1, status: NoteStatus.PINNED, title: 'new' } as INote })));

      comp.loadOne(1);

      expect(comp.pinnedNotes()).toEqual([expect.objectContaining({ id: 1, title: 'new' })]);
    });

    it('should move note from pinned to other when status changes', () => {
      comp.pinnedNotes.set([{ id: 1, status: NoteStatus.PINNED } as INote]);
      jest.spyOn(noteService, 'find').mockReturnValue(of(new HttpResponse({ body: { id: 1, status: NoteStatus.NORMAL } as INote })));

      comp.loadOne(1);

      expect(comp.pinnedNotes()).toEqual([]);
      expect(comp.otherNotes()).toEqual([expect.objectContaining({ id: 1 })]);
    });

    it('should move note from other to pinned when status changes', () => {
      comp.otherNotes.set([{ id: 1, status: NoteStatus.NORMAL } as INote]);
      jest.spyOn(noteService, 'find').mockReturnValue(of(new HttpResponse({ body: { id: 1, status: NoteStatus.PINNED } as INote })));

      comp.loadOne(1);

      expect(comp.otherNotes()).toEqual([]);
      expect(comp.pinnedNotes()).toEqual([expect.objectContaining({ id: 1 })]);
    });

    it('should add note if not present', () => {
      jest.spyOn(noteService, 'find').mockReturnValue(of(new HttpResponse({ body: { id: 99, status: NoteStatus.NORMAL } as INote })));

      comp.loadOne(99);

      expect(comp.otherNotes()).toEqual([expect.objectContaining({ id: 99 })]);
    });
  });

  describe('removeOne / addNote', () => {
    it('should remove one note from both collections', () => {
      comp.pinnedNotes.set([{ id: 1 } as INote]);
      comp.otherNotes.set([{ id: 2 } as INote]);

      comp.removeOne(1);
      comp.removeOne(2);

      expect(comp.pinnedNotes()).toEqual([]);
      expect(comp.otherNotes()).toEqual([]);
    });

    it('should add pinned note to pinned collection', () => {
      comp.addNote({ id: 1, status: NoteStatus.PINNED } as INote);

      expect(comp.pinnedNotes()).toEqual([expect.objectContaining({ id: 1 })]);
      expect(comp.otherNotes()).toEqual([]);
    });

    it('should add normal note to other collection', () => {
      comp.addNote({ id: 2, status: NoteStatus.NORMAL } as INote);

      expect(comp.otherNotes()).toEqual([expect.objectContaining({ id: 2 })]);
      expect(comp.pinnedNotes()).toEqual([]);
    });
  });

  describe('delete dialog', () => {
    let deleteModalMock: any;
	let modalSvc: NgbModal;
	
    beforeEach(() => {
      deleteModalMock = {
        componentInstance: {},
        closed: new Subject<string>(),
      };
	  modalSvc = (comp as any).modalService;
	  jest.spyOn(modalSvc, 'open').mockReturnValue(deleteModalMock);
    });

    it('should reset on confirm delete', fakeAsync(() => {
      const resetSpy = jest.spyOn(comp, 'reset').mockImplementation();

      comp.delete(sampleWithRequiredData);
      deleteModalMock.closed.next(ITEM_DELETED_EVENT);
      tick();

      expect(modalSvc.open).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
    }));

    it('should not reset on dismiss', fakeAsync(() => {
      const resetSpy = jest.spyOn(comp, 'reset').mockImplementation();

      comp.delete(sampleWithRequiredData);
      deleteModalMock.closed.next('cancel');
      tick();

      expect(modalSvc.open).toHaveBeenCalled();
      expect(resetSpy).not.toHaveBeenCalled();
    }));
  });

  describe('update dialog', () => {
	let modalSvc: NgbModal;
    let updateModalMock: any;

    beforeEach(() => {
      updateModalMock = {
        componentInstance: {},
        closed: new Subject<string>(),
      };
	  modalSvc = (comp as any).modalService;
	  jest.spyOn(modalSvc, 'open').mockReturnValue(updateModalMock);
    });

    it('should load one on MODIFIED', fakeAsync(() => {
      const loadOneSpy = jest.spyOn(comp, 'loadOne').mockImplementation();

      comp.openUpdateDialog({ id: 10 } as INote);
      updateModalMock.closed.next(ModalCloseReason.MODIFIED);
      tick();

      expect(loadOneSpy).toHaveBeenCalledWith(10);
    }));

    it('should remove one on delete-like close reasons', fakeAsync(() => {
      const removeOneSpy = jest.spyOn(comp, 'removeOne').mockImplementation();

      comp.openUpdateDialog({ id: 10 } as INote);
      updateModalMock.closed.next(ModalCloseReason.DELETED);
      tick();

      expect(removeOneSpy).toHaveBeenCalledWith(10);
    }));

    it('should set modal component note', () => {
      const note = { id: 10 } as INote;

      comp.openUpdateDialog(note);

      expect(updateModalMock.componentInstance.note).toBe(note);
    });
  });

  describe('pending edit dialog', () => {
    it('should open pending edit note once after response success', () => {
      const openSpy = jest.spyOn(comp, 'openUpdateDialog').mockImplementation();
      const navigateSpy = jest.spyOn(comp.router, 'navigate').mockResolvedValue(true);

      comp.pendingEditNoteId.set(123);

      (comp as any).onResponseSuccess(
        createResponse([{ id: 123, status: NoteStatus.NORMAL } as INote, { id: 124, status: NoteStatus.NORMAL } as INote]),
      );

      expect(openSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 123 }));
      expect(navigateSpy).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { editNoteId: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        }),
      );

      openSpy.mockClear();
      (comp as any).onResponseSuccess(createResponse([{ id: 123, status: NoteStatus.NORMAL } as INote]));

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should not open pending dialog if note is not found', () => {
      const openSpy = jest.spyOn(comp, 'openUpdateDialog').mockImplementation();

      comp.pendingEditNoteId.set(999);

      (comp as any).onResponseSuccess(createResponse([{ id: 1, status: NoteStatus.NORMAL } as INote]));

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('mouse and click behavior', () => {
    it('should record mouse position on mousedown', () => {
      comp.onMouseDown({ screenX: 100, screenY: 200 } as MouseEvent);

      expect(comp.mousePosition).toEqual({ x: 100, y: 200 });
    });

    it('should open update dialog on click when not dragging and movement is small', () => {
      const openSpy = jest.spyOn(comp, 'openUpdateDialog').mockImplementation();
      const note = { id: 1 } as INote;

      comp.onMouseDown({ screenX: 100, screenY: 100 } as MouseEvent);
      comp.onClick({ screenX: 102, screenY: 103 } as MouseEvent, note);

      expect(openSpy).toHaveBeenCalledWith(note);
    });

    it('should not open update dialog while dragging', () => {
      const openSpy = jest.spyOn(comp, 'openUpdateDialog').mockImplementation();
      const note = { id: 1 } as INote;

      comp.isDragging.set(true);
      comp.onMouseDown({ screenX: 100, screenY: 100 } as MouseEvent);
      comp.onClick({ screenX: 100, screenY: 100 } as MouseEvent, note);

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should not open update dialog when movement is too large', () => {
      const openSpy = jest.spyOn(comp, 'openUpdateDialog').mockImplementation();
      const note = { id: 1 } as INote;

      comp.onMouseDown({ screenX: 100, screenY: 100 } as MouseEvent);
      comp.onClick({ screenX: 120, screenY: 120 } as MouseEvent, note);

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('grid handling', () => {
    it('should store pinned grid and register events', () => {
      const gridMock = {
        on: jest.fn(),
        refreshItems: jest.fn().mockReturnThis(),
        layout: jest.fn(),
      } as any;

      jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback): number => {
        cb(0);
        return 1;
      });

      comp.onPinnedGridCreated(gridMock);

      expect(comp.gridPinned).toBe(gridMock);
      expect(gridMock.on).toHaveBeenCalledWith('dragInit', expect.any(Function));
      expect(gridMock.on).toHaveBeenCalledWith('dragReleaseEnd', expect.any(Function));
    });

    it('should store other grid and register events', () => {
      const gridMock = {
        on: jest.fn(),
        refreshItems: jest.fn().mockReturnThis(),
        layout: jest.fn(),
      } as any;

      jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback): number => {
        cb(0);
        return 1;
      });

      comp.onOtherGridCreated(gridMock);

      expect(comp.gridOther).toBe(gridMock);
      expect(gridMock.on).toHaveBeenCalledWith('dragInit', expect.any(Function));
      expect(gridMock.on).toHaveBeenCalledWith('dragReleaseEnd', expect.any(Function));
    });

    it('should refresh and layout both grids on resize', () => {
      comp.gridPinned = {
        refreshItems: jest.fn().mockReturnThis(),
        layout: jest.fn(),
      } as any;
      comp.gridOther = {
        refreshItems: jest.fn().mockReturnThis(),
        layout: jest.fn(),
      } as any;

      comp.onResized();

      expect(comp.gridPinned!.refreshItems).toHaveBeenCalled();
      expect(comp.gridPinned!.layout).toHaveBeenCalled();
      expect(comp.gridOther!.refreshItems).toHaveBeenCalled();
      expect(comp.gridOther!.layout).toHaveBeenCalled();
    });

    it('should update isDragging from registered grid events', () => {
      const handlers: Record<string, () => void> = {};
      const gridMock = {
        on: jest.fn((event: string, cb: () => void) => {
          handlers[event] = cb;
        }),
        refreshItems: jest.fn().mockReturnThis(),
        layout: jest.fn(),
      } as any;

      jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback): number => {
        cb(0);
        return 1;
      });

      comp.registerGridEvents(gridMock);

      handlers.dragInit();
      expect(comp.isDragging()).toBe(true);

      handlers.dragReleaseEnd();
      expect(comp.isDragging()).toBe(false);
    });
  });

  describe('formatting and utilities', () => {
    it('should format seconds ago', () => {
      jest.spyOn(translateService, 'instant').mockReturnValue('5 seconds ago');

      const result = comp.getFormattedLastUpdateDate({
        id: 1,
        lastModifiedDate: dayjs().subtract(5, 'second').toDate(),
      } as INote);

      expect(result).toBe('5 seconds ago');
    });

    it('should return empty string when lastModifiedDate is missing', () => {
      expect(comp.getFormattedLastUpdateDate({ id: 1 } as INote)).toBe('');
    });

    it('should delegate byteSize', () => {
      jest.spyOn(dataUtils, 'byteSize').mockReturnValue('10 bytes');

      const result = comp.byteSize('abc');

      expect(dataUtils.byteSize).toHaveBeenCalledWith('abc');
      expect(result).toBe('10 bytes');
    });

    it('should delegate openFile', () => {
      jest.spyOn(dataUtils, 'openFile').mockImplementation();

      comp.openFile('abc', 'text/plain');

      expect(dataUtils.openFile).toHaveBeenCalledWith('abc', 'text/plain');
    });

    it('should track tags by id', () => {
      expect(comp.trackByFn(0, { id: 123 } as INote)).toBe(123);
    });
  });

  describe('canShowCreate', () => {
    it('should allow create when status is normal and no collab/alarm restrictions', () => {
      comp.status.set(NoteStatus.NORMAL);
      comp.collab.set(false);
      comp.alarm.set(false);

      expect(comp.canShowCreate()).toBe(true);
    });

    it('should disallow create for archived status', () => {
      comp.status.set(NoteStatus.ARCHIVED);
      comp.collab.set(false);
      comp.alarm.set(false);

      expect(comp.canShowCreate()).toBe(false);
    });

    it('should disallow create when collaborator filter is active', () => {
      comp.status.set(NoteStatus.NORMAL);
      comp.collab.set(true);
      comp.alarm.set(false);

      expect(comp.canShowCreate()).toBe(false);
    });

    it('should disallow create when alarm filter is active', () => {
      comp.status.set(NoteStatus.NORMAL);
      comp.collab.set(false);
      comp.alarm.set(true);

      expect(comp.canShowCreate()).toBe(false);
    });
  });

  describe('tag patch update', () => {
    it('should update note tags and save patch', () => {
      const savePatchSpy = jest.spyOn(comp as any, 'savePatch').mockImplementation();
      const note = { id: 1, tags: [] } as INote;
      const tags = [{ id: 10 }] as ITag[];

      (comp as any).modelChangeFn(tags, note);

      expect(note.tags).toEqual(tags);
      expect(savePatchSpy).toHaveBeenCalledWith(note);
    });

    it('should not patch note without id', () => {
      jest.spyOn(noteService, 'partialUpdate');

      (comp as any).savePatch({ id: null, tags: [] } as any);

      expect(noteService.partialUpdate).not.toHaveBeenCalled();
    });

    it('should patch tags for existing note', () => {
      const subject = new Subject<any>();
      jest.spyOn(noteService, 'partialUpdate').mockReturnValue(subject);

      (comp as any).savePatch({ id: 1, tags: [{ id: 10 }] } as any);

      expect(comp.isSaving()).toBe(true);
      expect(noteService.partialUpdate).toHaveBeenCalledWith({
        id: 1,
        tags: [{ id: 10 }],
      });

      subject.next({});
      subject.complete();

      expect(comp.isSaving()).toBe(false);
    });
  });
});
