import { Component, DestroyRef, NgZone, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { Observable, combineLatest, filter, tap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';

import SharedModule from 'app/shared/shared.module';
import { SortService, type SortState, sortStateSignal } from 'app/shared/sort';
import { EllipsisDirective } from 'app/shared/ellipsis/ellipsis.directive';
import { MuuriGridDirective } from 'app/shared/muuri-wrapper/muuri-grid.directive';
import { MuuriGridItemDirective } from 'app/shared/muuri-wrapper/muuri-grid-item.directive';
import { FormsModule } from '@angular/forms';

import { ITEMS_PER_PAGE } from 'app/config/pagination.constants';
import { DEFAULT_SORT_DATA, ITEM_DELETED_EVENT, SORT } from 'app/config/navigation.constants';
import { DataUtils } from 'app/core/util/data-util.service';
import { ParseLinks } from 'app/core/util/parse-links.service';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { jhiCarouselComponent } from 'app/entities/attachment/carousel/carousel.component';
import { TagInputComponent } from 'app/entities/tag/tag-chips/tag-input/tag-input.component';
import { NoteDeleteDialogComponent } from '../delete/note-delete-dialog.component';
import { NoteUpdateDialogComponent } from '../update/note-update-dialog.component';
import { ModalCloseReason } from 'app/entities/enumerations/modal-close-reason.model';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { EntityArrayResponseType, EntityResponseType, NoteService } from '../service/note.service';
import { INote } from '../note.model';
import { AttachmentService } from 'app/entities/attachment/service/attachment.service';
import { ITag } from 'app/entities/tag/tag.model';

import { GridOptions } from 'muuri';
import Grid from 'muuri';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NoteCreateComponent } from '../create/note-create.component';

@Component({
  selector: 'jhi-note',
  standalone: true,
  templateUrl: './note.component.html',
  styleUrls: ['../note.scss'],
  imports: [
    RouterModule,
    NoteCreateComponent,
    FormsModule,
    SharedModule,
    InfiniteScrollDirective,
    jhiCarouselComponent,
    TagInputComponent,
    EllipsisDirective,
    MuuriGridDirective,
    MuuriGridItemDirective,
  ],
})
export class NoteComponent implements OnInit {
  // ========================
  // Reactive State (Signals)
  // ========================
  pinnedNotes = signal<INote[]>([]);
  otherNotes = signal<INote[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  sortState = sortStateSignal({});
  itemsPerPage = ITEMS_PER_PAGE;
  links: WritableSignal<Record<string, undefined | Record<string, string | undefined>>> = signal({});
  hasMorePage = computed(() => !!this.links().next);
  isFirstFetch = computed(() => Object.keys(this.links()).length === 0);
  status = signal<string | undefined>(undefined);
  collab = signal<boolean | undefined>(undefined);

  allNoteStatus = NoteStatus;
  // ========================
  // Muuri Grid Config
  // ========================
  isDragging = signal(false);
  gridPinned?: Grid;
  gridOther?: Grid;

  public layoutConfig: GridOptions = {
    layoutOnInit: true, // Muuri trigger layout method automatically on init
    layoutOnResize: true, //  trigger layout method on window resize
    dragEnabled: true, // items be draggable
    layoutDuration: 300, // The duration for item's layout animation in milliseconds
    layout: {
      fillGaps: true,
      horizontal: false,
      alignRight: false,
      alignBottom: false,
      rounding: true,
    },
    dragStartPredicate: {
      // determines when the item should start moving when the item is being dragged
      distance: 10, // How many pixels the user must drag before the drag procedure starts
      delay: 0, // ow long (in milliseconds) the user must drag before the dragging starts.
    },
  };

  mousePosition = {
    x: 0,
    y: 0,
  };

  // ========================
  // Dependency Injection
  // ========================
  public readonly router = inject(Router);
  protected readonly noteService = inject(NoteService);
  protected readonly attachmentService = inject(AttachmentService);
  protected readonly translateService = inject(TranslateService);
  protected readonly activatedRoute = inject(ActivatedRoute);
  protected readonly sortService = inject(SortService);
  protected parseLinks = inject(ParseLinks);
  protected dataUtils = inject(DataUtils);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  trackId = (item: INote): number => this.noteService.getNoteIdentifier(item);

  // ========================
  // Lifecycle
  // ========================
  ngOnInit(): void {
    combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data])
      .pipe(
        tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
        tap(() => this.reset()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    // Watch status & collab signals
    this.activatedRoute.queryParams
      .pipe(
        tap(params => {
          this.status.set(params['status']);
          this.collab.set(params['isCollaborator']);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // ========================
  // Grid Handling
  // ========================
  onPinnedGridCreated(grid: Grid): void {
    this.gridPinned = grid;
    this.registerGridEvents(grid);
    this.scheduleGridLayout(grid);
  }

  onOtherGridCreated(grid: Grid): void {
    this.gridOther = grid;
    this.registerGridEvents(grid);
    this.scheduleGridLayout(grid);
  }

  registerGridEvents(grid: Grid): void {
    grid.on('dragInit', () => this.isDragging.set(true));
    grid.on('dragReleaseEnd', () => this.isDragging.set(false));
  }

  onResized(): void {
    this.gridPinned?.refreshItems().layout();
    this.gridOther?.refreshItems().layout();
  }

  // ========================
  // Click vs Drag Protection
  // ========================

  onMouseDown(event: MouseEvent): void {
    this.mousePosition = {
      x: event.screenX,
      y: event.screenY,
    };
  }

  onClick(event: MouseEvent, note: INote): void {
    if (!this.isDragging() && Math.abs(this.mousePosition.x - event.screenX) <= 5 && Math.abs(this.mousePosition.y - event.screenY) <= 5) {
      this.openUpdateDialog(note);
    }
  }

  // ========================
  // Dialogs
  // ========================
  openUpdateDialog(note: INote): void {
    const modalRef = this.modalService.open(NoteUpdateDialogComponent, {
      scrollable: true,
      windowClass: 'note-detail-dialog',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.note = note;

    modalRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(reason => {
      switch (reason) {
        case ModalCloseReason.MODIFIED:
          this.loadOne(note.id);
          break;
        case ModalCloseReason.DELETED:
        case ModalCloseReason.ARCHIVED:
        case ModalCloseReason.UNDELETED:
        case ModalCloseReason.UNARCHIVED:
        case ModalCloseReason.PERMANENTDELETED:
          this.removeOne(note.id);
          break;
      }
    });
  }

  delete(note: INote): void {
    const modalRef = this.modalService.open(NoteDeleteDialogComponent, {
      size: 'lg',
      backdrop: 'static',
    });

    modalRef.componentInstance.note = note;
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        tap(() => this.reset()),
      )
      .subscribe();
  }

  // ========================
  // Data Loading
  // ========================
  load(): void {
    this.queryBackend().subscribe({
      next: (res: EntityArrayResponseType) => {
        this.onResponseSuccess(res);
      },
    });
  }

  loadOne(id: number): void {
    this.queryBackendOne(id).subscribe({
      next: (res: EntityResponseType) => {
        this.updateNote(res.body);
      },
    });
  }

  removeOne(id: number): void {
    this.pinnedNotes.update(list => list.filter(n => n.id !== id));
    this.otherNotes.update(list => list.filter(n => n.id !== id));
    this.relayoutAll();
  }

  reset(): void {
    this.pinnedNotes.set([]);
    this.otherNotes.set([]);
    this.load();
  }

  loadNextPage(): void {
    this.load();
  }

  addNote(note: INote): void {
    if (note.status === NoteStatus.PINNED) {
      this.pinnedNotes.update(notes => [...notes, note]);
    } else {
      this.otherNotes.update(notes => [...notes, note]);
    }
    this.relayoutAll();
  }
  // ========================
  // Utilities
  // ========================
  getFormattedLastUpdateDate(note: INote): string {
    if (!note.lastModifiedDate) return '';
    const lastModified = dayjs(note.lastModifiedDate);
    let time = dayjs().diff(lastModified, 's');
    if (time <= 60) {
      return this.translateService.instant('noticeMeApp.note.detail.secondsAgo', { time }) as string;
    }
    time = dayjs().diff(lastModified, 'm');
    if (time <= 60) {
      return this.translateService.instant('noticeMeApp.note.detail.minutesAgo', { time }) as string;
    }
    time = dayjs().diff(lastModified, 'h');
    if (time <= 24) {
      return this.translateService.instant('noticeMeApp.note.detail.hoursAgo', { time }) as string;
    }
    time = dayjs().diff(lastModified, 'd');
    if (time <= 31) {
      return this.translateService.instant('noticeMeApp.note.detail.daysAgo', { time }) as string;
    }
    time = dayjs().diff(lastModified, 'M');
    if (time <= 12) {
      return this.translateService.instant('noticeMeApp.note.detail.monthsAgo', { time }) as string;
    }
    time = dayjs().diff(lastModified, 'y');
    return this.translateService.instant('noticeMeApp.note.detail.yearsAgo', { time }) as string;
  }

  canShowCreate(): boolean {
    return (!this.status() || this.status() === NoteStatus.NORMAL || this.status() === NoteStatus.PINNED) && !this.collab();
  }

  trackByFn(index: number, tag: INote): number {
    return tag.id;
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    return this.dataUtils.openFile(base64String, contentType);
  }

  navigateToWithComponentValues(event: SortState): void {
    this.handleNavigation(event);
  }

  protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
    this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]));
  }

  protected handleNavigation(sortState: SortState): void {
    this.links.set({});

    const queryParamsObj = {
      sort: this.sortService.buildSortParam(sortState),
    };

    this.ngZone.run(() => {
      this.router.navigate(['./'], {
        relativeTo: this.activatedRoute,
        queryParams: queryParamsObj,
      });
    });
  }
  // ========================
  // Tag Patch Update
  // ========================

  protected modelChangeFn(tags: ITag[], note: INote): void {
    note.tags = tags;
    this.savePatch(note);
  }

  protected savePatch(note: INote): void {
    if (!note.id) return;
    this.isSaving.set(true);
    this.noteService
      .partialUpdate(note)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  // ========================
  // Data querying and pagination
  // ========================
  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading.set(true);
    const queryObject: any = {
      size: this.itemsPerPage,
      status: this.status(),
      isCollaborator: !!this.collab(),
      eagerload: true,
    };
    if (this.hasMorePage()) {
      Object.assign(queryObject, this.links().next);
    } else if (this.isFirstFetch()) {
      Object.assign(queryObject, { sort: this.sortService.buildSortParam(this.sortState()) });
    }
    return this.noteService.query(queryObject).pipe(tap(() => this.isLoading.set(false)));
  }

  protected queryBackendOne(id: number): Observable<EntityResponseType> {
    this.isLoading.set(true);
    return this.noteService.find(id).pipe(tap(() => this.isLoading.set(false)));
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    this.fillComponentAttributesFromResponseHeader(response.headers);
    this.fillComponentAttributesFromResponseBody(response.body);
    this.relayoutAll();
  }

  protected updateNote(data: INote | null): void {
    if (!data) return;
    const pinnedNotesArr = this.pinnedNotes();
    const otherNotesArr = this.otherNotes();
    // Try to find the note in pinned or other
    const isPinned = pinnedNotesArr.some(note => note.id === data.id);
    const isOther = otherNotesArr.some(note => note.id === data.id);
    if (isPinned) {
      if (data.status === NoteStatus.PINNED) {
        // update in place
        this.pinnedNotes.update(notes => notes.map(note => (note.id === data.id ? data : note)));
      } else {
        // move to otherNotes
        this.pinnedNotes.update(notes => notes.filter(note => note.id !== data.id));
        this.otherNotes.update(notes => [...notes, data]);
      }
    } else if (isOther) {
      if (data.status !== NoteStatus.PINNED) {
        // update in place
        this.otherNotes.update(notes => notes.map(note => (note.id === data.id ? data : note)));
      } else {
        // move to pinnedNotes
        this.otherNotes.update(notes => notes.filter(note => note.id !== data.id));
        this.pinnedNotes.update(notes => [...notes, data]);
      }
    }
    this.relayoutAll();
  }

  protected fillComponentAttributesFromResponseBody(data: INote[] | null): void {
    if (!data?.length) {
      return;
    }
    // If there is previous link, data is a infinite scroll pagination content.
    if (this.links().prev) {
      const pinnedMap = new Map(this.pinnedNotes().map(n => [n.id, n]));
      const othersMap = new Map(this.otherNotes().map(n => [n.id, n]));
      for (const note of data) {
        if (note.status === NoteStatus.PINNED) {
          pinnedMap.set(note.id, note);
        } else {
          othersMap.set(note.id, note);
        }
      }
      this.pinnedNotes.set([...pinnedMap.values()]);
      this.otherNotes.set([...othersMap.values()]);
      return;
    }
    // First load (reset collections)
    this.pinnedNotes.set(data.filter(note => note.status === NoteStatus.PINNED));
    this.otherNotes.set(data.filter(note => note.status !== NoteStatus.PINNED));
  }

  protected fillComponentAttributesFromResponseHeader(headers: HttpHeaders): void {
    const linkHeader = headers.get('link');
    if (linkHeader) {
      this.links.set(this.parseLinks.parseAll(linkHeader));
    } else {
      this.links.set({});
    }
  }

  private scheduleGridLayout(grid?: Grid): void {
    if (!grid) return;

    // Aspetta che Angular abbia finito il render visivo.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        grid.refreshItems().layout();
      });
    });
  }

  private relayoutAll(): void {
    this.scheduleGridLayout(this.gridPinned);
    this.scheduleGridLayout(this.gridOther);
  }
}
