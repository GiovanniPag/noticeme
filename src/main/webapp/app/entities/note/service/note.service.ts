import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { INote, NewNote } from '../note.model';

export type PartialUpdateNote = Partial<INote> & Pick<INote, 'id'>;

type RestOf<T extends INote | NewNote> = Omit<T, 'alarmDate'> & {
  alarmDate?: string | null;
};

export type RestNote = RestOf<INote>;

export type NewRestNote = RestOf<NewNote>;

export type PartialUpdateRestNote = RestOf<PartialUpdateNote>;

export type EntityResponseType = HttpResponse<INote>;
export type EntityArrayResponseType = HttpResponse<INote[]>;

@Injectable({ providedIn: 'root' })
export class NoteService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/notes');

  create(note: NewNote): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(note);
    return this.http.post<RestNote>(this.resourceUrl, copy, { observe: 'response' }).pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(note: INote): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(note);
    return this.http
      .put<RestNote>(`${this.resourceUrl}/${this.getNoteIdentifier(note)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(note: PartialUpdateNote): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(note);
    return this.http
      .patch<RestNote>(`${this.resourceUrl}/${this.getNoteIdentifier(note)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestNote>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestNote[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getNoteIdentifier(note: Pick<INote, 'id'>): number {
    return note.id;
  }

  compareNote(o1: Pick<INote, 'id'> | null, o2: Pick<INote, 'id'> | null): boolean {
    return o1 && o2 ? this.getNoteIdentifier(o1) === this.getNoteIdentifier(o2) : o1 === o2;
  }

  addNoteToCollectionIfMissing<Type extends Pick<INote, 'id'>>(
    noteCollection: Type[],
    ...notesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const notes: Type[] = notesToCheck.filter(isPresent);
    if (notes.length > 0) {
      const noteCollectionIdentifiers = noteCollection.map(noteItem => this.getNoteIdentifier(noteItem));
      const notesToAdd = notes.filter(noteItem => {
        const noteIdentifier = this.getNoteIdentifier(noteItem);
        if (noteCollectionIdentifiers.includes(noteIdentifier)) {
          return false;
        }
        noteCollectionIdentifiers.push(noteIdentifier);
        return true;
      });
      return [...notesToAdd, ...noteCollection];
    }
    return noteCollection;
  }

  protected convertDateFromClient<T extends INote | NewNote | PartialUpdateNote>(note: T): RestOf<T> {
    return {
      ...note,
      alarmDate: note.alarmDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restNote: RestNote): INote {
    return {
      ...restNote,
      alarmDate: restNote.alarmDate ? dayjs(restNote.alarmDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestNote>): HttpResponse<INote> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestNote[]>): HttpResponse<INote[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
