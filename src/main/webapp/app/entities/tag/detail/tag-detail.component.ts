import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { ITag } from '../tag.model';
import { INote } from 'app/entities/note/note.model';

@Component({
  selector: 'jhi-tag-detail',
  templateUrl: './tag-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class TagDetailComponent {
  tag = input<ITag | null>(null);
  relatedNotes = signal<INote[]>([]);

  protected router = inject(Router);

  previousState(): void {
    window.history.back();
  }

  openRelatedNote(note: Pick<INote, 'id' | 'status'>): void {
    switch (note.status) {
      case 'PINNED':
      case 'NORMAL':
        this.router.navigate(['/note'], {
          queryParams: { editNoteId: note.id },
        });
        break;
      case 'ARCHIVED':
        this.router.navigate(['/note'], {
          queryParams: { status: 'archived', editNoteId: note.id },
        });
        break;
      case 'DELETED':
        this.router.navigate(['/note'], {
          queryParams: { status: 'deleted', editNoteId: note.id },
        });
        break;
      default:
        this.router.navigate(['/note'], {
          queryParams: { editNoteId: note.id },
        });
    }
  }
}
