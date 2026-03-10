import dayjs from 'dayjs/esm';

import { INote, NewNote } from './note.model';

export const sampleWithRequiredData: INote = {
  id: 24031,
  status: 'ARCHIVED',
};

export const sampleWithPartialData: INote = {
  id: 25734,
  title: 'upon drain anenst',
  status: 'PINNED',
};

export const sampleWithFullData: INote = {
  id: 16663,
  title: 'before likewise which',
  content: '../fake-data/blob/hipster.txt',
  alarmDate: dayjs('2026-02-15T19:09'),
  status: 'DELETED',
};

export const sampleWithNewData: NewNote = {
  status: 'ARCHIVED',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
