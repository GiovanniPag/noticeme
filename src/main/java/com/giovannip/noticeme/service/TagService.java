package com.giovannip.noticeme.service;

import com.giovannip.noticeme.domain.Tag;
import com.giovannip.noticeme.repository.TagRepository;
import com.giovannip.noticeme.security.AuthoritiesConstants;
import com.giovannip.noticeme.security.SecurityUtils;
import com.giovannip.noticeme.service.dto.TagDTO;
import com.giovannip.noticeme.service.mapper.TagMapper;
import com.giovannip.noticeme.web.rest.errors.BadRequestAlertException;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.giovannip.noticeme.domain.Tag}.
 */
@Service
@Transactional
public class TagService {

    private static final Logger LOG = LoggerFactory.getLogger(TagService.class);

    private final TagRepository tagRepository;
    private final UserService userService;
    private static final String ENTITY_NAME = "tag";
    private final TagMapper tagMapper;

    public TagService(TagRepository tagRepository, TagMapper tagMapper, UserService userService) {
        this.tagRepository = tagRepository;
        this.userService = userService;
        this.tagMapper = tagMapper;
    }

    /**
     * Save a tag.
     *
     * @param tagDTO the entity to save.
     * @return the persisted entity.
     */
    public TagDTO save(TagDTO tagDTO) {
        LOG.debug("Request to save Tag : {}", tagDTO);
        Tag tag = tagMapper.toEntity(tagDTO);
        if (tag.getOwner() == null) {
            userService.getCurrentUser().ifPresent(tag::setOwner);
        }
        if (tagRepository.existsByTagNameAndOwnerLogin(tag.getTagName(), tag.getOwner().getLogin())) {
            throw new BadRequestAlertException("A new tag cannot have the same name of an existing one", ENTITY_NAME, "tagnameesxists");
        }
        tag = tagRepository.save(tag);
        return tagMapper.toDto(tag);
    }

    /**
     * Update a tag.
     *
     * @param tagDTO the entity to save.
     * @return the persisted entity.
     */
    public TagDTO update(TagDTO tagDTO) {
        LOG.debug("Request to update Tag : {}", tagDTO);
        Tag tag = tagMapper.toEntity(tagDTO);
        tag = tagRepository.save(tag);
        return tagMapper.toDto(tag);
    }

    /**
     * Partially update a tag.
     *
     * @param tagDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<TagDTO> partialUpdate(TagDTO tagDTO) {
        LOG.debug("Request to partially update Tag : {}", tagDTO);

        return tagRepository
            .findById(tagDTO.getId())
            .map(existingTag -> {
                tagMapper.partialUpdate(existingTag, tagDTO);

                return existingTag;
            })
            .map(tagRepository::save)
            .map(tagMapper::toDto);
    }

    /**
     * Get all the tags.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<TagDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Tags");
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            return tagRepository.findAll(pageable).map(tagMapper::toDto);
        }
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        return tagRepository.findAllByOwnerLogin(login, pageable).map(tagMapper::toDto);
    }

    /**
     * Get one tag by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<TagDTO> findOne(Long id) {
        LOG.debug("Request to get Tag : {}", id);
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            return tagRepository.findById(id).map(tagMapper::toDto);
        }
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        return tagRepository.findOneByIdAndOwnerLogin(id, login).map(tagMapper::toDto);
    }

    /**
     * Get one tag by tagname.
     *
     * @param tagname the tagname of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<TagDTO> findOne(String tagname) {
        LOG.debug("Request to get Tag : {}", tagname);
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        return tagRepository.findOneByTagNameAndOwnerLogin(tagname, login).map(tagMapper::toDto);
    }

    /**
     * Delete the tag by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Tag : {}", id);
        tagRepository.deleteById(id);
    }

    /**
     * Get all the tags filtered.
     *
     * @param pageable the pagination information.
     * @param
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<TagDTO> findFilterAll(Pageable pageable, String initial, String[] filterBy) {
        LOG.debug("Request to get filtered Tags");

        Collection<String> noteTags = filterBy == null ? Collections.emptyList() : Arrays.asList(filterBy);
        Long ownerId = userService.getUserWithAuthorities().orElseThrow().getId();

        if (noteTags.isEmpty()) {
            return tagRepository
                .findDistinctAllByOwnerIdAndTagNameStartingWithOrderByTagNameAsc(ownerId, initial, pageable)
                .map(tagMapper::toDto);
        }

        return tagRepository
            .findDistinctAllByOwnerIdAndTagNameNotInAndTagNameStartingWithOrderByTagNameAsc(ownerId, noteTags, initial, pageable)
            .map(tagMapper::toDto);
    }

    /**
     * Get all the tags filtered.
     *
     * @param pageable the pagination information.
     * @param
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<TagDTO> findFilterAll(Pageable pageable, String initial, Long noteid) {
        LOG.debug("Request to get filtered Tags");

        Long ownerId = userService.getUserWithAuthorities().orElseThrow().getId();

        Collection<String> noteTags = tagRepository.findDistinctAllByNotesId(noteid).stream().map(Tag::getTagName).toList();

        if (noteTags.isEmpty()) {
            return tagRepository
                .findDistinctAllByOwnerIdAndTagNameStartingWithOrderByTagNameAsc(ownerId, initial, pageable)
                .map(tagMapper::toDto);
        }

        return tagRepository
            .findDistinctAllByOwnerIdAndTagNameNotInAndTagNameStartingWithOrderByTagNameAsc(ownerId, noteTags, initial, pageable)
            .map(tagMapper::toDto);
    }
}
