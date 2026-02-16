import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../note-access.test-samples';

import { NoteAccessFormService } from './note-access-form.service';

describe('NoteAccess Form Service', () => {
  let service: NoteAccessFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteAccessFormService);
  });

  describe('Service methods', () => {
    describe('createNoteAccessFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createNoteAccessFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            role: expect.any(Object),
            note: expect.any(Object),
            user: expect.any(Object),
          }),
        );
      });

      it('passing INoteAccess should create a new form with FormGroup', () => {
        const formGroup = service.createNoteAccessFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            role: expect.any(Object),
            note: expect.any(Object),
            user: expect.any(Object),
          }),
        );
      });
    });

    describe('getNoteAccess', () => {
      it('should return NewNoteAccess for default NoteAccess initial value', () => {
        const formGroup = service.createNoteAccessFormGroup(sampleWithNewData);

        const noteAccess = service.getNoteAccess(formGroup) as any;

        expect(noteAccess).toMatchObject(sampleWithNewData);
      });

      it('should return NewNoteAccess for empty NoteAccess initial value', () => {
        const formGroup = service.createNoteAccessFormGroup();

        const noteAccess = service.getNoteAccess(formGroup) as any;

        expect(noteAccess).toMatchObject({});
      });

      it('should return INoteAccess', () => {
        const formGroup = service.createNoteAccessFormGroup(sampleWithRequiredData);

        const noteAccess = service.getNoteAccess(formGroup) as any;

        expect(noteAccess).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing INoteAccess should not enable id FormControl', () => {
        const formGroup = service.createNoteAccessFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewNoteAccess should disable id FormControl', () => {
        const formGroup = service.createNoteAccessFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
