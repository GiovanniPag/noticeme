import dayjs from 'dayjs/esm';

import { INote, NewNote } from './note.model';

export const sampleWithRequiredData: INote = {
  id: 24031,
  lastUpdateDate: dayjs('2026-02-16T06:37'),
  status: 'ARCHIVED',
};

export const sampleWithPartialData: INote = {
  id: 25734,
  title: 'upon drain anenst',
  lastUpdateDate: dayjs('2026-02-16T02:29'),
  status: 'PINNED',
};

export const sampleWithFullData: INote = {
  id: 16663,
  title: 'before likewise which',
  content: '../fake-data/blob/hipster.txt',
  lastUpdateDate: dayjs('2026-02-15T19:09'),
  alarmDate: dayjs('2026-02-16T10:19'),
  status: 'NORMAL',
};

export const sampleWithNewData: NewNote = {
  lastUpdateDate: dayjs('2026-02-16T05:01'),
  status: 'PINNED',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
