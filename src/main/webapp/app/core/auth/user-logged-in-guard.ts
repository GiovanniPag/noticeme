import { Injectable, isDevMode } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { AccountService } from './account.service';
import { Authority } from 'app/config/authority.constants';

@Injectable({ providedIn: 'root' })
export class LoggedInGuard implements CanActivate {
  constructor(private router: Router, private accountService: AccountService) {}

  canActivate(): Observable<boolean> {
    return this.checkLogin();
  }

  checkLogin(): Observable<boolean> {
    return this.accountService.identity().pipe(
      map(account => {
        if (account) {
          const hasAnyAuthority = this.accountService.hasAnyAuthority([Authority.ADMIN, Authority.USER]);
          if (hasAnyAuthority) {
            this.router.navigate(['']);
            return false;
          }
          if (isDevMode()) {
            console.error('User has authority, cannot enter');
          }
        }
        return true;
      })
    );
  }
}
