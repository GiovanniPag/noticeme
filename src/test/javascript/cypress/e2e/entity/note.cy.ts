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

describe('Note e2e test', () => {
  const notePageUrl = '/note';
  const notePageUrlPattern = new RegExp('/note(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  // const noteSample = {"lastUpdateDate":"2026-02-16T05:23:09.334Z","status":"ARCHIVED"};

  let note;
  // let user;

  beforeEach(() => {
    cy.login(username, password);
  });

  /* Disabled due to incompatibility
  beforeEach(() => {
    // create an instance at the required relationship entity:
    cy.authenticatedRequest({
      method: 'POST',
      url: '/api/users',
      body: {"login":"}NX@XY6XbP\\a7-SZcc","firstName":"Guenda","lastName":"Rollo","email":"Aquilino87@libero.it","imageUrl":"fervently likely repeatedly","langKey":"scarily mi"},
    }).then(({ body }) => {
      user = body;
    });
  });
   */

  beforeEach(() => {
    cy.intercept('GET', '/api/notes+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/api/notes').as('postEntityRequest');
    cy.intercept('DELETE', '/api/notes/*').as('deleteEntityRequest');
  });

  /* Disabled due to incompatibility
  beforeEach(() => {
    // Simulate relationships api for better performance and reproducibility.
    cy.intercept('GET', '/api/attachments', {
      statusCode: 200,
      body: [],
    });

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [user],
    });

    cy.intercept('GET', '/api/tags', {
      statusCode: 200,
      body: [],
    });

  });
   */

  afterEach(() => {
    if (note) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/notes/${note.id}`,
      }).then(() => {
        note = undefined;
      });
    }
  });

  /* Disabled due to incompatibility
  afterEach(() => {
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

  it('Notes menu should load Notes page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('note');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Note').should('exist');
    cy.url().should('match', notePageUrlPattern);
  });

  describe('Note page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(notePageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Note page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/note/new$'));
        cy.getEntityCreateUpdateHeading('Note');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', notePageUrlPattern);
      });
    });

    describe('with existing value', () => {
      /* Disabled due to incompatibility
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/api/notes',
          body: {
            ...noteSample,
            owner: user,
          },
        }).then(({ body }) => {
          note = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/api/notes+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/api/notes?page=0&size=20>; rel="last",<http://localhost/api/notes?page=0&size=20>; rel="first"',
              },
              body: [note],
            }
          ).as('entitiesRequestInternal');
        });

        cy.visit(notePageUrl);

        cy.wait('@entitiesRequestInternal');
      });
       */

      beforeEach(function () {
        cy.visit(notePageUrl);

        cy.wait('@entitiesRequest').then(({ response }) => {
          if (response?.body.length === 0) {
            this.skip();
          }
        });
      });

      it('detail button click should load details Note page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('note');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', notePageUrlPattern);
      });

      it('edit button click should load edit Note page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Note');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', notePageUrlPattern);
      });

      it('edit button click should load edit Note page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Note');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', notePageUrlPattern);
      });

      // Reason: cannot create a required entity with relationship with required relationships.
      it.skip('last delete button click should delete instance of Note', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('note').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', notePageUrlPattern);

        note = undefined;
      });
    });
  });

  describe('new Note page', () => {
    beforeEach(() => {
      cy.visit(`${notePageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Note');
    });

    // Reason: cannot create a required entity with relationship with required relationships.
    it.skip('should create an instance of Note', () => {
      cy.get(`[data-cy="title"]`).type('delirious');
      cy.get(`[data-cy="title"]`).should('have.value', 'delirious');

      cy.get(`[data-cy="content"]`).type('../fake-data/blob/hipster.txt');
      cy.get(`[data-cy="content"]`).invoke('val').should('match', new RegExp('../fake-data/blob/hipster.txt'));

      cy.get(`[data-cy="lastUpdateDate"]`).type('2026-02-16T02:09');
      cy.get(`[data-cy="lastUpdateDate"]`).blur();
      cy.get(`[data-cy="lastUpdateDate"]`).should('have.value', '2026-02-16T02:09');

      cy.get(`[data-cy="alarmDate"]`).type('2026-02-15T18:02');
      cy.get(`[data-cy="alarmDate"]`).blur();
      cy.get(`[data-cy="alarmDate"]`).should('have.value', '2026-02-15T18:02');

      cy.get(`[data-cy="status"]`).select('PINNED');

      cy.get(`[data-cy="owner"]`).select(1);

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        note = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.url().should('match', notePageUrlPattern);
    });
  });
});
