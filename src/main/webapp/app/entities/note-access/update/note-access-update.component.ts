import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { INote } from 'app/entities/note/note.model';
import { NoteService } from 'app/entities/note/service/note.service';
import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';
import { AccessRole } from 'app/entities/enumerations/access-role.model';
import { NoteAccessService } from '../service/note-access.service';
import { INoteAccess } from '../note-access.model';
import { NoteAccessFormGroup, NoteAccessFormService } from './note-access-form.service';

@Component({
  selector: 'jhi-note-access-update',
  templateUrl: './note-access-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class NoteAccessUpdateComponent implements OnInit {
  isSaving = false;
  noteAccess: INoteAccess | null = null;
  accessRoleValues = Object.keys(AccessRole);

  notesSharedCollection: INote[] = [];
  usersSharedCollection: IUser[] = [];

  protected noteAccessService = inject(NoteAccessService);
  protected noteAccessFormService = inject(NoteAccessFormService);
  protected noteService = inject(NoteService);
  protected userService = inject(UserService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: NoteAccessFormGroup = this.noteAccessFormService.createNoteAccessFormGroup();

  compareNote = (o1: INote | null, o2: INote | null): boolean => this.noteService.compareNote(o1, o2);

  compareUser = (o1: IUser | null, o2: IUser | null): boolean => this.userService.compareUser(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ noteAccess }) => {
      this.noteAccess = noteAccess;
      if (noteAccess) {
        this.updateForm(noteAccess);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const noteAccess = this.noteAccessFormService.getNoteAccess(this.editForm);
    if (noteAccess.id !== null) {
      this.subscribeToSaveResponse(this.noteAccessService.update(noteAccess));
    } else {
      this.subscribeToSaveResponse(this.noteAccessService.create(noteAccess));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<INoteAccess>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(noteAccess: INoteAccess): void {
    this.noteAccess = noteAccess;
    this.noteAccessFormService.resetForm(this.editForm, noteAccess);

    this.notesSharedCollection = this.noteService.addNoteToCollectionIfMissing<INote>(this.notesSharedCollection, noteAccess.note);
    this.usersSharedCollection = this.userService.addUserToCollectionIfMissing<IUser>(this.usersSharedCollection, noteAccess.user);
  }

  protected loadRelationshipsOptions(): void {
    this.noteService
      .query()
      .pipe(map((res: HttpResponse<INote[]>) => res.body ?? []))
      .pipe(map((notes: INote[]) => this.noteService.addNoteToCollectionIfMissing<INote>(notes, this.noteAccess?.note)))
      .subscribe((notes: INote[]) => (this.notesSharedCollection = notes));

    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(map((users: IUser[]) => this.userService.addUserToCollectionIfMissing<IUser>(users, this.noteAccess?.user)))
      .subscribe((users: IUser[]) => (this.usersSharedCollection = users));
  }
}
