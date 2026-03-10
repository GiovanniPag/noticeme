import {
  entityConfirmDeleteButtonSelector,
  entityCreateButtonSelector,
  entityCreateCancelButtonSelector,
  entityCreateSaveButtonSelector,
  entityDeleteButtonSelector,
  entityDetailsBackButtonSelector,
  entityDetailsButtonSelector,
  entityEditButtonSelector,
  entityTableSelector,
} from '../../support/entity';

describe('NoteAccess e2e test', () => {
  const noteAccessPageUrl = '/note-access';
  const noteAccessPageUrlPattern = new RegExp('/note-access(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  // const noteAccessSample = {"role":"EDITOR"};

  let noteAccess;
  // let note;
  // let user;

  beforeEach(() => {
    cy.login(username, password);
  });

  /* Disabled due to incompatibility
  beforeEach(() => {
    // create an instance at the required relationship entity:
    cy.authenticatedRequest({
      method: 'POST',
      url: '/api/notes',
      body: {"title":"by","content":"Li4vZmFrZS1kYXRhL2Jsb2IvaGlwc3Rlci50eHQ=","alarmDate":"2026-02-16T10:11:41.838Z","status":"PINNED"},
    }).then(({ body }) => {
      note = body;
    });
    // create an instance at the required relationship entity:
    cy.authenticatedRequest({
      method: 'POST',
      url: '/api/users',
      body: {"login":"m","firstName":"Clemenzia","lastName":"Biagetti","email":"Emilio_Marcucci@yahoo.com","imageUrl":"negative shovel amid","langKey":"putrid fel"},
    }).then(({ body }) => {
      user = body;
    });
  });
   */

  beforeEach(() => {
    cy.intercept('GET', '/api/note-accesses+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/api/note-accesses').as('postEntityRequest');
    cy.intercept('DELETE', '/api/note-accesses/*').as('deleteEntityRequest');
  });

  /* Disabled due to incompatibility
  beforeEach(() => {
    // Simulate relationships api for better performance and reproducibility.
    cy.intercept('GET', '/api/notes', {
      statusCode: 200,
      body: [note],
    });

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [user],
    });

  });
   */

  afterEach(() => {
    if (noteAccess) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/note-accesses/${noteAccess.id}`,
      }).then(() => {
        noteAccess = undefined;
      });
    }
  });

  /* Disabled due to incompatibility
  afterEach(() => {
    if (note) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/notes/${note.id}`,
      }).then(() => {
        note = undefined;
      });
    }
    if (user) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/users/${user.id}`,
      }).then(() => {
        user = undefined;
      });
    }
  });
   */

  it('NoteAccesses menu should load NoteAccesses page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('note-access');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('NoteAccess').should('exist');
    cy.url().should('match', noteAccessPageUrlPattern);
  });

  describe('NoteAccess page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(noteAccessPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create NoteAccess page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/note-access/new$'));
        cy.getEntityCreateUpdateHeading('NoteAccess');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', noteAccessPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      /* Disabled due to incompatibility
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/api/note-accesses',
          body: {
            ...noteAccessSample,
            note: note,
            user: user,
          },
        }).then(({ body }) => {
          noteAccess = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/api/note-accesses+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/api/note-accesses?page=0&size=20>; rel="last",<http://localhost/api/note-accesses?page=0&size=20>; rel="first"',
              },
              body: [noteAccess],
            }
          ).as('entitiesRequestInternal');
        });

        cy.visit(noteAccessPageUrl);

        cy.wait('@entitiesRequestInternal');
      });
       */

      beforeEach(function () {
        cy.visit(noteAccessPageUrl);

        cy.wait('@entitiesRequest').then(({ response }) => {
          if (response?.body.length === 0) {
            this.skip();
          }
        });
      });

      it('detail button click should load details NoteAccess page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('noteAccess');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', noteAccessPageUrlPattern);
      });

      it('edit button click should load edit NoteAccess page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('NoteAccess');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', noteAccessPageUrlPattern);
      });

      it('edit button click should load edit NoteAccess page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('NoteAccess');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', noteAccessPageUrlPattern);
      });

      // Reason: cannot create a required entity with relationship with required relationships.
      it.skip('last delete button click should delete instance of NoteAccess', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('noteAccess').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', noteAccessPageUrlPattern);

        noteAccess = undefined;
      });
    });
  });

  describe('new NoteAccess page', () => {
    beforeEach(() => {
      cy.visit(`${noteAccessPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('NoteAccess');
    });

    // Reason: cannot create a required entity with relationship with required relationships.
    it.skip('should create an instance of NoteAccess', () => {
      cy.get(`[data-cy="role"]`).select('VIEWER');

      cy.get(`[data-cy="note"]`).select(1);
      cy.get(`[data-cy="user"]`).select(1);

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        noteAccess = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.url().should('match', noteAccessPageUrlPattern);
    });
  });
});
