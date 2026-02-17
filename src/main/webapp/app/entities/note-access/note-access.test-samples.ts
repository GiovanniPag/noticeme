import { INoteAccess, NewNoteAccess } from './note-access.model';

export const sampleWithRequiredData: INoteAccess = {
  id: 13128,
  role: 'VIEWER',
};

export const sampleWithPartialData: INoteAccess = {
  id: 5751,
  role: 'VIEWER',
};

export const sampleWithFullData: INoteAccess = {
  id: 5670,
  role: 'EDITOR',
};

export const sampleWithNewData: NewNoteAccess = {
  role: 'EDITOR',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
