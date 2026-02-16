import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { INoteAccess, NewNoteAccess } from '../note-access.model';

export type PartialUpdateNoteAccess = Partial<INoteAccess> & Pick<INoteAccess, 'id'>;

export type EntityResponseType = HttpResponse<INoteAccess>;
export type EntityArrayResponseType = HttpResponse<INoteAccess[]>;

@Injectable({ providedIn: 'root' })
export class NoteAccessService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/note-accesses');

  create(noteAccess: NewNoteAccess): Observable<EntityResponseType> {
    return this.http.post<INoteAccess>(this.resourceUrl, noteAccess, { observe: 'response' });
  }

  update(noteAccess: INoteAccess): Observable<EntityResponseType> {
    return this.http.put<INoteAccess>(`${this.resourceUrl}/${this.getNoteAccessIdentifier(noteAccess)}`, noteAccess, {
      observe: 'response',
    });
  }

  partialUpdate(noteAccess: PartialUpdateNoteAccess): Observable<EntityResponseType> {
    return this.http.patch<INoteAccess>(`${this.resourceUrl}/${this.getNoteAccessIdentifier(noteAccess)}`, noteAccess, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<INoteAccess>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<INoteAccess[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getNoteAccessIdentifier(noteAccess: Pick<INoteAccess, 'id'>): number {
    return noteAccess.id;
  }

  compareNoteAccess(o1: Pick<INoteAccess, 'id'> | null, o2: Pick<INoteAccess, 'id'> | null): boolean {
    return o1 && o2 ? this.getNoteAccessIdentifier(o1) === this.getNoteAccessIdentifier(o2) : o1 === o2;
  }

  addNoteAccessToCollectionIfMissing<Type extends Pick<INoteAccess, 'id'>>(
    noteAccessCollection: Type[],
    ...noteAccessesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const noteAccesses: Type[] = noteAccessesToCheck.filter(isPresent);
    if (noteAccesses.length > 0) {
      const noteAccessCollectionIdentifiers = noteAccessCollection.map(noteAccessItem => this.getNoteAccessIdentifier(noteAccessItem));
      const noteAccessesToAdd = noteAccesses.filter(noteAccessItem => {
        const noteAccessIdentifier = this.getNoteAccessIdentifier(noteAccessItem);
        if (noteAccessCollectionIdentifiers.includes(noteAccessIdentifier)) {
          return false;
        }
        noteAccessCollectionIdentifiers.push(noteAccessIdentifier);
        return true;
      });
      return [...noteAccessesToAdd, ...noteAccessCollection];
    }
    return noteAccessCollection;
  }
}
