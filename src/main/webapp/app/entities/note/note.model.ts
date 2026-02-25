import dayjs from 'dayjs/esm';
import { IUser } from 'app/entities/user/user.model';
import { ITag } from 'app/entities/tag/tag.model';
import { NoteStatus } from 'app/entities/enumerations/note-status.model';
import { IAttachment } from 'app/entities/attachment/attachment.model';

export interface INote {
  id: number;
  title?: string | null;
  content?: string | null;
  alarmDate?: dayjs.Dayjs | null;
  status?: keyof typeof NoteStatus | null;
  owner?: Pick<IUser, 'id'> | null;
  tags?: Pick<ITag, 'id' | 'tagName'>[] | null;
  attachments?: Pick<IAttachment, 'id' | 'fileName' | 'data' | 'dataContentType' | 'fileSize'>[] | null;
  createdBy?: string;
  createdDate?: Date;
  lastModifiedBy?: string;
  lastModifiedDate?: Date;
}

export type NewNote = Omit<INote, 'id'> & { id: null };
