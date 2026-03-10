import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { ITag } from '../tag.model';
import { INote } from 'app/entities/note/note.model';
import { NoteService } from 'app/entities/note/service/note.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'jhi-tag-detail',
  templateUrl: './tag-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class TagDetailComponent {
  tag = input<ITag | null>(null);
  relatedNotes = signal<INote[]>([]);

  protected router = inject(Router);
  protected noteService = inject(NoteService);

  constructor() {
    effect(() => {
      const tag = this.tag();
      const noteRefs = tag?.notes ?? [];

      if (!noteRefs.length) {
        this.relatedNotes.set([]);
        return;
      }

      const requests = noteRefs.map(note => this.noteService.find(note.id));

      if (!requests.length) {
        this.relatedNotes.set([]);
        return;
      }

      forkJoin(requests).subscribe({
        next: responses => {
          this.relatedNotes.set(responses.map(response => response.body).filter((note): note is INote => note != null));
        },
        error: () => {
          this.relatedNotes.set([]);
        },
      });
    });
  }

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
