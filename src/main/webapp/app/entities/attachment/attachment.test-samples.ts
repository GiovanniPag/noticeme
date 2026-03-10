import { IAttachment, NewAttachment } from './attachment.model';

export const sampleWithRequiredData: IAttachment = {
  id: 15526,
  fileName: 'ouch',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'unknown',
};

export const sampleWithPartialData: IAttachment = {
  id: 11307,
  fileName: 'covenant excited by',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'unknown',
  fileSize: 27491,
};

export const sampleWithFullData: IAttachment = {
  id: 21727,
  fileName: 'hierarchy ha editor',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'unknown',
  fileSize: 4238,
};

export const sampleWithNewData: NewAttachment = {
  fileName: 'fatally responsibility',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'unknown',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
