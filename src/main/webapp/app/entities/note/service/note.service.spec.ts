import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { INote } from '../note.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../note.test-samples';

import { NoteService, RestNote } from './note.service';

const requireRestSample: RestNote = {
  ...sampleWithRequiredData,
  lastUpdateDate: sampleWithRequiredData.lastUpdateDate?.toJSON(),
  alarmDate: sampleWithRequiredData.alarmDate?.toJSON(),
};

describe('Note Service', () => {
  let service: NoteService;
  let httpMock: HttpTestingController;
  let expectedResult: INote | INote[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(NoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find(123).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Note', () => {
      const note = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(note).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Note', () => {
      const note = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(note).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Note', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Note', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Note', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addNoteToCollectionIfMissing', () => {
      it('should add a Note to an empty array', () => {
        const note: INote = sampleWithRequiredData;
        expectedResult = service.addNoteToCollectionIfMissing([], note);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(note);
      });

      it('should not add a Note to an array that contains it', () => {
        const note: INote = sampleWithRequiredData;
        const noteCollection: INote[] = [
          {
            ...note,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addNoteToCollectionIfMissing(noteCollection, note);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Note to an array that doesn't contain it", () => {
        const note: INote = sampleWithRequiredData;
        const noteCollection: INote[] = [sampleWithPartialData];
        expectedResult = service.addNoteToCollectionIfMissing(noteCollection, note);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(note);
      });

      it('should add only unique Note to an array', () => {
        const noteArray: INote[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const noteCollection: INote[] = [sampleWithRequiredData];
        expectedResult = service.addNoteToCollectionIfMissing(noteCollection, ...noteArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const note: INote = sampleWithRequiredData;
        const note2: INote = sampleWithPartialData;
        expectedResult = service.addNoteToCollectionIfMissing([], note, note2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(note);
        expect(expectedResult).toContain(note2);
      });

      it('should accept null and undefined values', () => {
        const note: INote = sampleWithRequiredData;
        expectedResult = service.addNoteToCollectionIfMissing([], null, note, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(note);
      });

      it('should return initial array if no Note is added', () => {
        const noteCollection: INote[] = [sampleWithRequiredData];
        expectedResult = service.addNoteToCollectionIfMissing(noteCollection, undefined, null);
        expect(expectedResult).toEqual(noteCollection);
      });
    });

    describe('compareNote', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareNote(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 1015 };
        const entity2 = null;

        const compareResult1 = service.compareNote(entity1, entity2);
        const compareResult2 = service.compareNote(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 1015 };
        const entity2 = { id: 14975 };

        const compareResult1 = service.compareNote(entity1, entity2);
        const compareResult2 = service.compareNote(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 1015 };
        const entity2 = { id: 1015 };

        const compareResult1 = service.compareNote(entity1, entity2);
        const compareResult2 = service.compareNote(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
