package com.giovannip.noticeme.service;

import com.giovannip.noticeme.domain.NoteAccess;
import com.giovannip.noticeme.repository.NoteAccessRepository;
import com.giovannip.noticeme.service.dto.NoteAccessDTO;
import com.giovannip.noticeme.service.mapper.NoteAccessMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.giovannip.noticeme.domain.NoteAccess}.
 */
@Service
@Transactional
public class NoteAccessService {

    private static final Logger LOG = LoggerFactory.getLogger(NoteAccessService.class);

    private final NoteAccessRepository noteAccessRepository;

    private final NoteAccessMapper noteAccessMapper;

    public NoteAccessService(NoteAccessRepository noteAccessRepository, NoteAccessMapper noteAccessMapper) {
        this.noteAccessRepository = noteAccessRepository;
        this.noteAccessMapper = noteAccessMapper;
    }

    /**
     * Save a noteAccess.
     *
     * @param noteAccessDTO the entity to save.
     * @return the persisted entity.
     */
    public NoteAccessDTO save(NoteAccessDTO noteAccessDTO) {
        LOG.debug("Request to save NoteAccess : {}", noteAccessDTO);
        NoteAccess noteAccess = noteAccessMapper.toEntity(noteAccessDTO);
        noteAccess = noteAccessRepository.save(noteAccess);
        return noteAccessMapper.toDto(noteAccess);
    }

    /**
     * Update a noteAccess.
     *
     * @param noteAccessDTO the entity to save.
     * @return the persisted entity.
     */
    public NoteAccessDTO update(NoteAccessDTO noteAccessDTO) {
        LOG.debug("Request to update NoteAccess : {}", noteAccessDTO);
        NoteAccess noteAccess = noteAccessMapper.toEntity(noteAccessDTO);
        noteAccess = noteAccessRepository.save(noteAccess);
        return noteAccessMapper.toDto(noteAccess);
    }

    /**
     * Partially update a noteAccess.
     *
     * @param noteAccessDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<NoteAccessDTO> partialUpdate(NoteAccessDTO noteAccessDTO) {
        LOG.debug("Request to partially update NoteAccess : {}", noteAccessDTO);

        return noteAccessRepository
            .findById(noteAccessDTO.getId())
            .map(existingNoteAccess -> {
                noteAccessMapper.partialUpdate(existingNoteAccess, noteAccessDTO);

                return existingNoteAccess;
            })
            .map(noteAccessRepository::save)
            .map(noteAccessMapper::toDto);
    }

    /**
     * Get all the noteAccesses.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<NoteAccessDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all NoteAccesses");
        return noteAccessRepository.findAll(pageable).map(noteAccessMapper::toDto);
    }

    /**
     * Get one noteAccess by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<NoteAccessDTO> findOne(Long id) {
        LOG.debug("Request to get NoteAccess : {}", id);
        return noteAccessRepository.findById(id).map(noteAccessMapper::toDto);
    }

    /**
     * Delete the noteAccess by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete NoteAccess : {}", id);
        noteAccessRepository.deleteById(id);
    }
}
