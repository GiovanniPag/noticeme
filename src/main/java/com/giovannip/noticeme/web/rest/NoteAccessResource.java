package com.giovannip.noticeme.web.rest;

import com.giovannip.noticeme.repository.NoteAccessRepository;
import com.giovannip.noticeme.service.NoteAccessService;
import com.giovannip.noticeme.service.dto.NoteAccessDTO;
import com.giovannip.noticeme.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.giovannip.noticeme.domain.NoteAccess}.
 */
@RestController
@RequestMapping("/api/note-accesses")
public class NoteAccessResource {

    private static final Logger LOG = LoggerFactory.getLogger(NoteAccessResource.class);

    private static final String ENTITY_NAME = "noteAccess";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final NoteAccessService noteAccessService;

    private final NoteAccessRepository noteAccessRepository;

    public NoteAccessResource(NoteAccessService noteAccessService, NoteAccessRepository noteAccessRepository) {
        this.noteAccessService = noteAccessService;
        this.noteAccessRepository = noteAccessRepository;
    }

    /**
     * {@code POST  /note-accesses} : Create a new noteAccess.
     *
     * @param noteAccessDTO the noteAccessDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new noteAccessDTO, or with status {@code 400 (Bad Request)} if the noteAccess has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<NoteAccessDTO> createNoteAccess(@Valid @RequestBody NoteAccessDTO noteAccessDTO) throws URISyntaxException {
        LOG.debug("REST request to save NoteAccess : {}", noteAccessDTO);
        if (noteAccessDTO.getId() != null) {
            throw new BadRequestAlertException("A new noteAccess cannot already have an ID", ENTITY_NAME, "idexists");
        }
        noteAccessDTO = noteAccessService.save(noteAccessDTO);
        return ResponseEntity.created(new URI("/api/note-accesses/" + noteAccessDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, noteAccessDTO.getId().toString()))
            .body(noteAccessDTO);
    }

    /**
     * {@code PUT  /note-accesses/:id} : Updates an existing noteAccess.
     *
     * @param id the id of the noteAccessDTO to save.
     * @param noteAccessDTO the noteAccessDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated noteAccessDTO,
     * or with status {@code 400 (Bad Request)} if the noteAccessDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the noteAccessDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<NoteAccessDTO> updateNoteAccess(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody NoteAccessDTO noteAccessDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update NoteAccess : {}, {}", id, noteAccessDTO);
        if (noteAccessDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, noteAccessDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!noteAccessRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        noteAccessDTO = noteAccessService.update(noteAccessDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, noteAccessDTO.getId().toString()))
            .body(noteAccessDTO);
    }

    /**
     * {@code PATCH  /note-accesses/:id} : Partial updates given fields of an existing noteAccess, field will ignore if it is null
     *
     * @param id the id of the noteAccessDTO to save.
     * @param noteAccessDTO the noteAccessDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated noteAccessDTO,
     * or with status {@code 400 (Bad Request)} if the noteAccessDTO is not valid,
     * or with status {@code 404 (Not Found)} if the noteAccessDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the noteAccessDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<NoteAccessDTO> partialUpdateNoteAccess(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody NoteAccessDTO noteAccessDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update NoteAccess partially : {}, {}", id, noteAccessDTO);
        if (noteAccessDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, noteAccessDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!noteAccessRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<NoteAccessDTO> result = noteAccessService.partialUpdate(noteAccessDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, noteAccessDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /note-accesses} : get all the noteAccesses.
     *
     * @param pageable the pagination information.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of noteAccesses in body.
     */
    @GetMapping("")
    public ResponseEntity<List<NoteAccessDTO>> getAllNoteAccesses(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        LOG.debug("REST request to get a page of NoteAccesses");
        Page<NoteAccessDTO> page = noteAccessService.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /note-accesses/:id} : get the "id" noteAccess.
     *
     * @param id the id of the noteAccessDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the noteAccessDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<NoteAccessDTO> getNoteAccess(@PathVariable("id") Long id) {
        LOG.debug("REST request to get NoteAccess : {}", id);
        Optional<NoteAccessDTO> noteAccessDTO = noteAccessService.findOne(id);
        return ResponseUtil.wrapOrNotFound(noteAccessDTO);
    }

    /**
     * {@code DELETE  /note-accesses/:id} : delete the "id" noteAccess.
     *
     * @param id the id of the noteAccessDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNoteAccess(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete NoteAccess : {}", id);
        noteAccessService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
