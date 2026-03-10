import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import NoteAccessResolve from './route/note-access-routing-resolve.service';

const noteAccessRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/note-access.component').then(m => m.NoteAccessComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/note-access-detail.component').then(m => m.NoteAccessDetailComponent),
    resolve: {
      noteAccess: NoteAccessResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/note-access-update.component').then(m => m.NoteAccessUpdateComponent),
    resolve: {
      noteAccess: NoteAccessResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/note-access-update.component').then(m => m.NoteAccessUpdateComponent),
    resolve: {
      noteAccess: NoteAccessResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default noteAccessRoute;
