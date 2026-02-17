package com.giovannip.noticeme.web.rest;

import static com.giovannip.noticeme.domain.NoteAccessAsserts.*;
import static com.giovannip.noticeme.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giovannip.noticeme.IntegrationTest;
import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.domain.NoteAccess;
import com.giovannip.noticeme.domain.User;
import com.giovannip.noticeme.domain.enumeration.AccessRole;
import com.giovannip.noticeme.repository.NoteAccessRepository;
import com.giovannip.noticeme.repository.UserRepository;
import com.giovannip.noticeme.service.dto.NoteAccessDTO;
import com.giovannip.noticeme.service.mapper.NoteAccessMapper;
import jakarta.persistence.EntityManager;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link NoteAccessResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class NoteAccessResourceIT {

    private static final AccessRole DEFAULT_ROLE = AccessRole.VIEWER;
    private static final AccessRole UPDATED_ROLE = AccessRole.EDITOR;

    private static final String ENTITY_API_URL = "/api/note-accesses";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private NoteAccessRepository noteAccessRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NoteAccessMapper noteAccessMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restNoteAccessMockMvc;

    private NoteAccess noteAccess;

    private NoteAccess insertedNoteAccess;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static NoteAccess createEntity(EntityManager em) {
        NoteAccess noteAccess = new NoteAccess().role(DEFAULT_ROLE);
        // Add required entity
        Note note;
        if (TestUtil.findAll(em, Note.class).isEmpty()) {
            note = NoteResourceIT.createEntity(em);
            em.persist(note);
            em.flush();
        } else {
            note = TestUtil.findAll(em, Note.class).get(0);
        }
        noteAccess.setNote(note);
        // Add required entity
        User user = UserResourceIT.createEntity();
        em.persist(user);
        em.flush();
        noteAccess.setUser(user);
        return noteAccess;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static NoteAccess createUpdatedEntity(EntityManager em) {
        NoteAccess updatedNoteAccess = new NoteAccess().role(UPDATED_ROLE);
        // Add required entity
        Note note;
        if (TestUtil.findAll(em, Note.class).isEmpty()) {
            note = NoteResourceIT.createUpdatedEntity(em);
            em.persist(note);
            em.flush();
        } else {
            note = TestUtil.findAll(em, Note.class).get(0);
        }
        updatedNoteAccess.setNote(note);
        // Add required entity
        User user = UserResourceIT.createEntity();
        em.persist(user);
        em.flush();
        updatedNoteAccess.setUser(user);
        return updatedNoteAccess;
    }

    @BeforeEach
    void initTest() {
        noteAccess = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedNoteAccess != null) {
            noteAccessRepository.delete(insertedNoteAccess);
            insertedNoteAccess = null;
        }
    }

    @Test
    @Transactional
    void createNoteAccess() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the NoteAccess
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);
        var returnedNoteAccessDTO = om.readValue(
            restNoteAccessMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(noteAccessDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            NoteAccessDTO.class
        );

        // Validate the NoteAccess in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedNoteAccess = noteAccessMapper.toEntity(returnedNoteAccessDTO);
        assertNoteAccessUpdatableFieldsEquals(returnedNoteAccess, getPersistedNoteAccess(returnedNoteAccess));

        insertedNoteAccess = returnedNoteAccess;
    }

    @Test
    @Transactional
    void createNoteAccessWithExistingId() throws Exception {
        // Create the NoteAccess with an existing ID
        noteAccess.setId(1L);
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restNoteAccessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(noteAccessDTO)))
            .andExpect(status().isBadRequest());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkRoleIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        noteAccess.setRole(null);

        // Create the NoteAccess, which fails.
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        restNoteAccessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(noteAccessDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllNoteAccesses() throws Exception {
        // Initialize the database
        insertedNoteAccess = noteAccessRepository.saveAndFlush(noteAccess);

        // Get all the noteAccessList
        restNoteAccessMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(noteAccess.getId().intValue())))
            .andExpect(jsonPath("$.[*].role").value(hasItem(DEFAULT_ROLE.toString())));
    }

    @Test
    @Transactional
    void getNoteAccess() throws Exception {
        // Initialize the database
        insertedNoteAccess = noteAccessRepository.saveAndFlush(noteAccess);

        // Get the noteAccess
        restNoteAccessMockMvc
            .perform(get(ENTITY_API_URL_ID, noteAccess.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(noteAccess.getId().intValue()))
            .andExpect(jsonPath("$.role").value(DEFAULT_ROLE.toString()));
    }

    @Test
    @Transactional
    void getNonExistingNoteAccess() throws Exception {
        // Get the noteAccess
        restNoteAccessMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingNoteAccess() throws Exception {
        // Initialize the database
        insertedNoteAccess = noteAccessRepository.saveAndFlush(noteAccess);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the noteAccess
        NoteAccess updatedNoteAccess = noteAccessRepository.findById(noteAccess.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedNoteAccess are not directly saved in db
        em.detach(updatedNoteAccess);
        updatedNoteAccess.role(UPDATED_ROLE);
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(updatedNoteAccess);

        restNoteAccessMockMvc
            .perform(
                put(ENTITY_API_URL_ID, noteAccessDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(noteAccessDTO))
            )
            .andExpect(status().isOk());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedNoteAccessToMatchAllProperties(updatedNoteAccess);
    }

    @Test
    @Transactional
    void putNonExistingNoteAccess() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        noteAccess.setId(longCount.incrementAndGet());

        // Create the NoteAccess
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restNoteAccessMockMvc
            .perform(
                put(ENTITY_API_URL_ID, noteAccessDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(noteAccessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchNoteAccess() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        noteAccess.setId(longCount.incrementAndGet());

        // Create the NoteAccess
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restNoteAccessMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(noteAccessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamNoteAccess() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        noteAccess.setId(longCount.incrementAndGet());

        // Create the NoteAccess
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restNoteAccessMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(noteAccessDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateNoteAccessWithPatch() throws Exception {
        // Initialize the database
        insertedNoteAccess = noteAccessRepository.saveAndFlush(noteAccess);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the noteAccess using partial update
        NoteAccess partialUpdatedNoteAccess = new NoteAccess();
        partialUpdatedNoteAccess.setId(noteAccess.getId());

        partialUpdatedNoteAccess.role(UPDATED_ROLE);

        restNoteAccessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedNoteAccess.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedNoteAccess))
            )
            .andExpect(status().isOk());

        // Validate the NoteAccess in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertNoteAccessUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedNoteAccess, noteAccess),
            getPersistedNoteAccess(noteAccess)
        );
    }

    @Test
    @Transactional
    void fullUpdateNoteAccessWithPatch() throws Exception {
        // Initialize the database
        insertedNoteAccess = noteAccessRepository.saveAndFlush(noteAccess);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the noteAccess using partial update
        NoteAccess partialUpdatedNoteAccess = new NoteAccess();
        partialUpdatedNoteAccess.setId(noteAccess.getId());

        partialUpdatedNoteAccess.role(UPDATED_ROLE);

        restNoteAccessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedNoteAccess.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedNoteAccess))
            )
            .andExpect(status().isOk());

        // Validate the NoteAccess in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertNoteAccessUpdatableFieldsEquals(partialUpdatedNoteAccess, getPersistedNoteAccess(partialUpdatedNoteAccess));
    }

    @Test
    @Transactional
    void patchNonExistingNoteAccess() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        noteAccess.setId(longCount.incrementAndGet());

        // Create the NoteAccess
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restNoteAccessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, noteAccessDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(noteAccessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchNoteAccess() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        noteAccess.setId(longCount.incrementAndGet());

        // Create the NoteAccess
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restNoteAccessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(noteAccessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamNoteAccess() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        noteAccess.setId(longCount.incrementAndGet());

        // Create the NoteAccess
        NoteAccessDTO noteAccessDTO = noteAccessMapper.toDto(noteAccess);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restNoteAccessMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(noteAccessDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the NoteAccess in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteNoteAccess() throws Exception {
        // Initialize the database
        insertedNoteAccess = noteAccessRepository.saveAndFlush(noteAccess);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the noteAccess
        restNoteAccessMockMvc
            .perform(delete(ENTITY_API_URL_ID, noteAccess.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return noteAccessRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected NoteAccess getPersistedNoteAccess(NoteAccess noteAccess) {
        return noteAccessRepository.findById(noteAccess.getId()).orElseThrow();
    }

    protected void assertPersistedNoteAccessToMatchAllProperties(NoteAccess expectedNoteAccess) {
        assertNoteAccessAllPropertiesEquals(expectedNoteAccess, getPersistedNoteAccess(expectedNoteAccess));
    }

    protected void assertPersistedNoteAccessToMatchUpdatableProperties(NoteAccess expectedNoteAccess) {
        assertNoteAccessAllUpdatablePropertiesEquals(expectedNoteAccess, getPersistedNoteAccess(expectedNoteAccess));
    }
}
