describe('Note custom e2e', () => {
  const notePageUrl = '/note';
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';

  let createdNoteId: number | undefined;

  beforeEach(() => {
    cy.login(username, password);
    cy.intercept('GET', '/api/notes*').as('getNotes');
    cy.intercept('POST', '/api/notes').as('postNote');
    cy.intercept('PATCH', '/api/notes/*').as('patchNote');
    cy.intercept('PUT', '/api/notes/*').as('putNote');
    cy.intercept('DELETE', '/api/notes/*').as('deleteNote');
  });

  afterEach(() => {
    if (createdNoteId) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/notes/${createdNoteId}`,
      }).then(() => {
        createdNoteId = undefined;
      });
    }
  });

  it('should create a new note and show it in the list', () => {
    const title = `E2E note ${Date.now()}`;
    const content = 'Nota creata automaticamente da Cypress';

    cy.visit(notePageUrl);
    cy.wait('@getNotes');

    cy.get('[data-cy="title"]').should('be.visible');
    cy.get('[data-cy="title"]').clear();
    cy.get('[data-cy="title"]').type(title);

    cy.get('[data-cy="content"]').should('be.visible');
    cy.get('[data-cy="content"]').clear();
    cy.get('[data-cy="content"]').type(content);
    cy.get('[data-cy="NoteSaveButton"]').click();

    cy.wait('@postNote').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      createdNoteId = response?.body?.id;
    });

    cy.contains(title).should('be.visible');
  });

  it('should create a new note with a tag and show both in the list', () => {
    const title = `E2E tagged note ${Date.now()}`;
    const content = 'Nota con tag aggiunto via Cypress';
    const tagName = `studio-${Date.now()}`;

    cy.visit(notePageUrl);
    cy.wait('@getNotes');

    cy.get('[data-cy="title"]').should('be.visible');
    cy.get('[data-cy="title"]').clear();
    cy.get('[data-cy="title"]').type(title);

    cy.get('[data-cy="content"]').should('be.visible');
    cy.get('[data-cy="content"]').clear();
    cy.get('[data-cy="content"]').type(content);

    cy.get('[data-cy="tagInput"]').should('be.visible');
    cy.get('[data-cy="tagInput"]').type(`${tagName}{enter}`);

    cy.get('[data-cy="NoteSaveButton"]').should('be.visible');
    cy.get('[data-cy="NoteSaveButton"]').click();

    cy.get('[data-cy="tagInput"]').should('be.visible').type(`${tagName}{enter}`);

    cy.get('[data-cy="NoteSaveButton"]').should('be.visible').click();

    cy.wait('@postNote').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      createdNoteId = response?.body?.id;
    });

    cy.contains('h5.card-title', title, { timeout: 10000 }).should('be.visible');
    cy.contains('.card-text', content).should('be.visible');
    cy.contains('[data-cy="tagChip"]', tagName, { timeout: 10000 }).should('be.visible');
  });

  it('should create a note, open update dialog, add a tag and show both in UI', () => {
    const title = `E2E dialog tag note ${Date.now()}`;
    const content = 'Nota da aggiornare dal dialog';
    const initialTag = `iniziale-${Date.now()}`;
    const addedTag = `aggiunto-${Date.now()}`;

    cy.visit(notePageUrl);
    cy.wait('@getNotes');

    cy.get('[data-cy="title"]').should('be.visible');
    cy.get('[data-cy="title"]').clear();
    cy.get('[data-cy="title"]').type(title);

    cy.get('[data-cy="content"]').should('be.visible');
    cy.get('[data-cy="content"]').clear();
    cy.get('[data-cy="content"]').type(content);

    cy.get('[data-cy="tagInput"]').first().should('be.visible');
    cy.get('[data-cy="tagInput"]').first().type(`${initialTag}{enter}`);

    cy.get('[data-cy="NoteSaveButton"]').should('be.visible');
    cy.get('[data-cy="NoteSaveButton"]').click();

    cy.wait('@postNote').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      createdNoteId = response?.body?.id;
    });

    cy.contains('[data-cy="noteTitle"]', title, { timeout: 10000 }).should('be.visible');

    // apre il dialog di update cliccando la card della nota
    cy.contains('[data-cy="noteCard"] [data-cy="noteTitle"]', title).closest('[data-cy="noteCard"]').click();
    // lavora dentro il modal/dialog
    cy.get('[data-cy="noteUpdateDialog"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.contains('[data-cy="tagChip"]', initialTag).should('be.visible');
        cy.get('[data-cy="tagInput"]').should('be.visible').type(`${addedTag}{enter}`);
        cy.get('[data-cy="NoteSaveEdit"]').click({ force: true });
      });
    cy.wait('@patchNote').then(({ request, response }) => {
      expect(request.url).to.include(`/api/notes/${createdNoteId}`);
      expect(response?.statusCode).to.eq(200);
    });

    cy.contains('[data-cy="noteCard"] [data-cy="noteTitle"]', title)
      .closest('[data-cy="noteCard"]')
      .within(() => {
        cy.contains('[data-cy="tagChip"]', initialTag, { timeout: 10000 }).should('be.visible');
        cy.contains('[data-cy="tagChip"]', addedTag, { timeout: 10000 }).should('be.visible');
      });
  });
});
