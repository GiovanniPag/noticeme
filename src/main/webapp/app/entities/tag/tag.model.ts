import { IUser } from 'app/entities/user/user.model';
import { INote } from 'app/entities/note/note.model';

export interface ITag {
  id: number;
  tagName?: string | null;
  color?: string | null;
  owner?: Pick<IUser, 'id'> | null;
  notes?: Pick<INote, 'id'>[] | null;
}

export type NewTag = Omit<ITag, 'id'> & { id: null };
