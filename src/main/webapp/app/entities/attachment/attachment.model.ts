import { INote } from 'app/entities/note/note.model';

export interface IAttachment {
  id: number;
  fileName?: string | null;
  data?: string | null;
  dataContentType?: string | null;
  dataContentType?: string | null;
  fileSize?: number | null;
  note?: Pick<INote, 'id'> | null;
}

export type NewAttachment = Omit<IAttachment, 'id'> & { id: null };
