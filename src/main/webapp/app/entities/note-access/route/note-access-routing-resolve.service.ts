import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { INoteAccess } from '../note-access.model';
import { NoteAccessService } from '../service/note-access.service';

const noteAccessResolve = (route: ActivatedRouteSnapshot): Observable<null | INoteAccess> => {
  const id = route.params.id;
  if (id) {
    return inject(NoteAccessService)
      .find(id)
      .pipe(
        mergeMap((noteAccess: HttpResponse<INoteAccess>) => {
          if (noteAccess.body) {
            return of(noteAccess.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default noteAccessResolve;
