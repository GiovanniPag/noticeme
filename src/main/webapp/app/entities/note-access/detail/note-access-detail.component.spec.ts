import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { NoteAccessDetailComponent } from './note-access-detail.component';

describe('NoteAccess Management Detail Component', () => {
  let comp: NoteAccessDetailComponent;
  let fixture: ComponentFixture<NoteAccessDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteAccessDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./note-access-detail.component').then(m => m.NoteAccessDetailComponent),
              resolve: { noteAccess: () => of({ id: 26436 }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(NoteAccessDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteAccessDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load noteAccess on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', NoteAccessDetailComponent);

      // THEN
      expect(instance.noteAccess()).toEqual(expect.objectContaining({ id: 26436 }));
    });
  });

  describe('PreviousState', () => {
    it('should navigate to previous state', () => {
      jest.spyOn(window.history, 'back');
      comp.previousState();
      expect(window.history.back).toHaveBeenCalled();
    });
  });
});
