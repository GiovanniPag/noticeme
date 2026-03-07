import { Route } from '@angular/router';

import RegisterComponent from './register.component';
import { LoggedInGuard } from 'app/core/auth/user-logged-in-guard';

const registerRoute: Route = {
  path: 'register',
  component: RegisterComponent,
  title: 'register.title',
  canActivate: [LoggedInGuard],
};

export default registerRoute;
