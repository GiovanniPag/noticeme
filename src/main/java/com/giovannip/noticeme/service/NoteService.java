package com.giovannip.noticeme.service;

import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.domain.Tag;
import com.giovannip.noticeme.domain.User;
import com.giovannip.noticeme.domain.enumeration.NoteStatus;
import com.giovannip.noticeme.repository.NoteRepository;
import com.giovannip.noticeme.repository.TagRepository;
import com.giovannip.noticeme.security.AuthoritiesConstants;
import com.giovannip.noticeme.security.SecurityUtils;
import com.giovannip.noticeme.service.dto.NoteDTO;
import com.giovannip.noticeme.service.dto.TagDTO;
import com.giovannip.noticeme.service.mapper.NoteMapper;
import com.giovannip.noticeme.web.rest.errors.BadRequestAlertException;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.giovannip.noticeme.domain.Note}.
 */
@Service
@Transactional
public class NoteService {

    private static final Logger LOG = LoggerFactory.getLogger(NoteService.class);

    private final NoteRepository noteRepository;
    private final UserService userService;
    private final TagRepository tagRepository;
    
    private final NoteMapper noteMapper;

    public NoteService(NoteRepository noteRepository, NoteMapper noteMapper, UserService userService, TagRepository tagRepository) {
        this.noteRepository = noteRepository;
        this.userService = userService;
        this.noteMapper = noteMapper;
        this.tagRepository = tagRepository;
    }

    /**
     * Save a note.
     *
     * @param noteDTO the entity to save.
     * @return the persisted entity.
     */
    public NoteDTO save(NoteDTO noteDTO) {
        LOG.debug("Request to save Note : {}", noteDTO);
        validateOwnedTags(noteDTO);

        Note note = noteMapper.toEntity(noteDTO);
        
        if (note.getId() == null) {
            User currentUser = this.userService.getCurrentUser().orElseThrow();
            note.setOwner(currentUser);
        }
        note = noteRepository.save(note);
        return noteMapper.toDto(note);
    }

    /**
     * Update a note.
     *
     * @param noteDTO the entity to save.
     * @return the persisted entity.
     */
    public NoteDTO update(NoteDTO noteDTO) {
        LOG.debug("Request to update Note : {}", noteDTO);
        validateOwnedTags(noteDTO);

        Note existingNote = noteRepository
                .findById(noteDTO.getId())
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id " + noteDTO.getId()));
        existingNote.setTitle(noteDTO.getTitle());
        existingNote.setContent(noteDTO.getContent());
        existingNote.setAlarmDate(noteDTO.getAlarmDate());
        existingNote.setStatus(noteDTO.getStatus());

        Set<Tag> resolvedTags = resolveOwnedTags(noteDTO);
        if (resolvedTags != null) {
            existingNote.setTags(resolvedTags);
        }

        existingNote = noteRepository.saveAndFlush(existingNote);
        return noteMapper.toDto(existingNote);
    }

    /**
     * Partially update a note.
     *
     * @param noteDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<NoteDTO> partialUpdate(NoteDTO noteDTO) {
        LOG.debug("Request to partially update Note : {}", noteDTO);
        validateOwnedTags(noteDTO);

        return noteRepository
            .findById(noteDTO.getId())
            .map(existingNote -> {
                noteMapper.partialUpdate(existingNote, noteDTO);

                return existingNote;
            })
            .map(noteRepository::save)
            .map(noteMapper::toDto);
    }

    /**
     * Get all the notes.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<NoteDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Notes");
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            return noteRepository.findAll(pageable).map(noteMapper::toDto);
        }
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        return noteRepository.findAllByOwnerLogin(login, pageable).map(noteMapper::toDto);
    }

    /**
     * Get all the notes with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<NoteDTO> findAllWithEagerRelationships(Pageable pageable) {
        Page<Note> page;
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            page = noteRepository.findAllWithEagerRelationships(pageable);
        } else {
            String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
            page = noteRepository.findAllWithEagerRelationshipsByOwnerLogin(login, pageable);
        }

        return page.map(noteMapper::toDto);
    }

    /**
     * Get all the notes filtered by status.
     *
     * @param pageable the pagination information.
     * @param status the requested status filter.
     * @param hasAlarm whether only notes with alarm should be returned.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<NoteDTO> findAllByStatus(Pageable pageable, String status, boolean hasAlarm, boolean isCollaborator) {
        LOG.debug("Request to get all Notes by status");

        Collection<NoteStatus> statuses = noteStatusFilter(status);

        Page<Note> page;
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            page = hasAlarm
                ? noteRepository.findAllByStatusInAndAlarmDateIsNotNull(statuses, pageable)
                : noteRepository.findAllByStatusInOrderByStatusDesc(statuses, pageable);
        } else {
            String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
            page = hasAlarm
                ? noteRepository.findAllByOwnerLoginAndStatusInAndAlarmDateIsNotNull(login, statuses, pageable)
                : noteRepository.findAllByOwnerLoginAndStatusInOrderByStatusDesc(login, statuses, pageable);
        }

        return page.map(noteMapper::toDto);
    }

    /**
     * Get all the notes with eager loading of many-to-many relationships, filtered by status.
     *
     * @param pageable the pagination information.
     * @param status the requested status filter.
     * @param hasAlarm whether only notes with alarm should be returned.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<NoteDTO> findAllWithEagerRelationshipsByStatus(Pageable pageable, String status, boolean hasAlarm, boolean isCollaborator) {
        LOG.debug("Request to get all Notes with eager relationships by status");

        Collection<NoteStatus> statuses = noteStatusFilter(status);

        Page<Note> page;
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            page = hasAlarm
                ? noteRepository.findAllWithEagerRelationshipsByStatusInAndAlarmDateIsNotNull(statuses, pageable)
                : noteRepository.findAllWithEagerRelationshipsByStatusIn(statuses, pageable);
        } else {
            String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
            page = hasAlarm
                ? noteRepository.findAllWithEagerRelationshipsByOwnerLoginAndStatusInAndAlarmDateIsNotNull(login, statuses, pageable)
                : noteRepository.findAllWithEagerRelationshipsByOwnerLoginAndStatusIn(login, statuses, pageable);
        }

        return page.map(noteMapper::toDto);
    }

    /**
     * Get one note by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<NoteDTO> findOne(Long id) {
        LOG.debug("Request to get Note : {}", id);
        Optional<Note> note;
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            note = noteRepository.findOneWithEagerRelationships(id);
        } else {
            String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
            note = noteRepository.findOneWithEagerRelationshipsAndOwnerLogin(id, login);
        }
        return note.map(noteMapper::toDto);
    }

    /**
     * Delete the note by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Note : {}", id);
        noteRepository.deleteById(id);
    }

    private Collection<NoteStatus> noteStatusFilter(String status) {
        if (status == null || status.isBlank() || "undefined".equalsIgnoreCase(status)) {
            return List.of(NoteStatus.NORMAL, NoteStatus.PINNED);
        }

        return switch (status.toLowerCase()) {
            case "archived" -> List.of(NoteStatus.ARCHIVED);
            case "deleted" -> List.of(NoteStatus.DELETED);
            default -> List.of(NoteStatus.NORMAL, NoteStatus.PINNED);
        };
    }
    
    private void validateOwnedTags(NoteDTO noteDTO) {
        if (noteDTO.getTags() == null || noteDTO.getTags().isEmpty()) {
            return;
        }

        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new IllegalStateException("Current user not found"));

        Set<Long> tagIds = noteDTO.getTags().stream()
            .map(TagDTO::getId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        if (tagIds.size() != noteDTO.getTags().size()) {
            throw new BadRequestAlertException(
                "Invalid tag list",
                "note",
                "taginvalid"
            );
        }

        long ownedTagCount = tagRepository.countByIdInAndOwnerLogin(tagIds, currentLogin);

        if (ownedTagCount != tagIds.size()) {
            throw new BadRequestAlertException(
                "A note can only use tags owned by the current user",
                "note",
                "foreigntag"
            );
        }
    }
    
    private Set<Tag> resolveOwnedTags(NoteDTO noteDTO) {
        if (noteDTO.getTags() == null) {
            return null;
        }

        if (noteDTO.getTags().isEmpty()) {
            return new java.util.HashSet<>();
        }

        Set<Long> tagIds = noteDTO.getTags().stream()
            .map(TagDTO::getId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        if (tagIds.size() != noteDTO.getTags().size()) {
            throw new BadRequestAlertException("Invalid tag list", "note", "taginvalid");
        }

        Set<Tag> tags = new java.util.HashSet<>(tagRepository.findAllById(tagIds));

        if (tags.size() != tagIds.size()) {
            throw new BadRequestAlertException("Some tags do not exist", "note", "tagnotfound");
        }

        return tags;
    }
}
