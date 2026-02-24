import { Component, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { environment } from 'environments/environment';
import { LANGUAGES } from 'app/config/language.constants';
import { AccountService } from 'app/core/auth/account.service';
import { ProfileService } from 'app/layouts/profiles/profile.service';
import { SideBarService } from './sidebar.service';

@Component({
  selector: 'jhi-sidebar',
  standalone: true,
  imports: [RouterModule, SharedModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  host: {
    '[class.is-active]': 'sideBarService.isActive()',
  },
})
export default class SidebarComponent {
  languages = LANGUAGES;
  version = environment.VERSION
    ? environment.VERSION.toLowerCase().startsWith('v')
      ? environment.VERSION
      : `v${environment.VERSION}`
    : '';
  readonly profileInfo = signal<{ inProduction?: boolean; openAPIEnabled?: boolean }>({});
  readonly inProduction = computed(() => this.profileInfo().inProduction ?? false);
  readonly openAPIEnabled = computed(() => this.profileInfo().openAPIEnabled ?? false);
  private readonly sideBarService = inject(SideBarService);
  private readonly accountService = inject(AccountService);
  private readonly profileService = inject(ProfileService);
  private readonly account = this.accountService.trackCurrentAccount();

  constructor() {
    // subscribe using signals
    this.profileService.getProfileInfo().subscribe(info => this.profileInfo.set(info));
  }

  isAuthenticated(): boolean {
    return !!this.account();
  }
}
