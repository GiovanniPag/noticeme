import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'authority',
    data: { pageTitle: 'noticeMeApp.adminAuthority.home.title' },
    loadChildren: () => import('./admin/authority/authority.routes'),
  },
  {
    path: 'tag',
    data: { pageTitle: 'noticeMeApp.tag.home.title' },
    loadChildren: () => import('./tag/tag.routes'),
  },
  {
    path: 'note',
    data: { pageTitle: 'noticeMeApp.note.home.title' },
    loadChildren: () => import('./note/note.routes'),
  },
  {
    path: 'attachment',
    data: { pageTitle: 'noticeMeApp.attachment.home.title' },
    loadChildren: () => import('./attachment/attachment.routes'),
  },
  {
    path: 'note-access',
    data: { pageTitle: 'noticeMeApp.noteAccess.home.title' },
    loadChildren: () => import('./note-access/note-access.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
