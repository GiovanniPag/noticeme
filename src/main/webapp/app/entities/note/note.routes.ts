import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import NoteResolve from './route/note-routing-resolve.service';

const noteRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/note.component').then(m => m.NoteComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/note-detail.component').then(m => m.NoteDetailComponent),
    resolve: {
      note: NoteResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/note-update.component').then(m => m.NoteUpdateComponent),
    resolve: {
      note: NoteResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/note-update.component').then(m => m.NoteUpdateComponent),
    resolve: {
      note: NoteResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default noteRoute;
