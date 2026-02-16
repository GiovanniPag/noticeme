import { IAttachment, NewAttachment } from './attachment.model';

export const sampleWithRequiredData: IAttachment = {
  id: 15526,
  fileName: 'ouch',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'until unruly',
};

export const sampleWithPartialData: IAttachment = {
  id: 11307,
  fileName: 'covenant excited by',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'triangular onto diversity',
  fileSize: 4962,
};

export const sampleWithFullData: IAttachment = {
  id: 21727,
  fileName: 'hierarchy ha editor',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'unless',
  fileSize: 18607,
};

export const sampleWithNewData: NewAttachment = {
  fileName: 'fatally responsibility',
  data: '../fake-data/blob/hipster.png',
  dataContentType: 'fully though deeply',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
