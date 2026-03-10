import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { INoteAccess } from '../note-access.model';

@Component({
  selector: 'jhi-note-access-detail',
  templateUrl: './note-access-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class NoteAccessDetailComponent {
  noteAccess = input<INoteAccess | null>(null);

  previousState(): void {
    window.history.back();
  }
}
