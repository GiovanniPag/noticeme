import { INote } from 'app/entities/note/note.model';

export interface IAttachmentSummary {
  id: number;
  fileName?: string | null;
  dataContentType?: string | null;
  fileSize?: number | null;
}

export interface IAttachment extends IAttachmentSummary {
  data?: string | null;
  note?: Pick<INote, 'id'> | null;
}

export type NewAttachment = Omit<IAttachment, 'id'> & { id: null };
