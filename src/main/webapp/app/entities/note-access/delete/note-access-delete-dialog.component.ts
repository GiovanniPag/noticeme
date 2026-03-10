import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { INoteAccess } from '../note-access.model';
import { NoteAccessService } from '../service/note-access.service';

@Component({
  templateUrl: './note-access-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class NoteAccessDeleteDialogComponent {
  noteAccess?: INoteAccess;

  protected noteAccessService = inject(NoteAccessService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.noteAccessService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
