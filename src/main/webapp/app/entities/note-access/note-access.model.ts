import { INote } from 'app/entities/note/note.model';
import { IUser } from 'app/entities/user/user.model';
import { AccessRole } from 'app/entities/enumerations/access-role.model';

export interface INoteAccess {
  id: number;
  role?: keyof typeof AccessRole | null;
  note?: Pick<INote, 'id'> | null;
  user?: Pick<IUser, 'id'> | null;
}

export type NewNoteAccess = Omit<INoteAccess, 'id'> & { id: null };
