package com.giovannip.noticeme.service;

import com.giovannip.noticeme.domain.Attachment;
import com.giovannip.noticeme.repository.AttachmentRepository;
import com.giovannip.noticeme.security.AuthoritiesConstants;
import com.giovannip.noticeme.security.SecurityUtils;
import com.giovannip.noticeme.service.dto.AttachmentDTO;
import com.giovannip.noticeme.service.mapper.AttachmentMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.giovannip.noticeme.domain.Attachment}.
 */
@Service
@Transactional
public class AttachmentService {

    private static final Logger LOG = LoggerFactory.getLogger(AttachmentService.class);

    private final AttachmentRepository attachmentRepository;

    private final AttachmentMapper attachmentMapper;

    public AttachmentService(AttachmentRepository attachmentRepository, AttachmentMapper attachmentMapper) {
        this.attachmentRepository = attachmentRepository;
        this.attachmentMapper = attachmentMapper;
    }

    /**
     * Save a attachment.
     *
     * @param attachmentDTO the entity to save.
     * @return the persisted entity.
     */
    public AttachmentDTO save(AttachmentDTO attachmentDTO) {
        LOG.debug("Request to save Attachment : {}", attachmentDTO);
        Attachment attachment = attachmentMapper.toEntity(attachmentDTO);
        attachment = attachmentRepository.save(attachment);
        return attachmentMapper.toDto(attachment);
    }

    /**
     * Update a attachment.
     *
     * @param attachmentDTO the entity to save.
     * @return the persisted entity.
     */
    public AttachmentDTO update(AttachmentDTO attachmentDTO) {
        LOG.debug("Request to update Attachment : {}", attachmentDTO);
        Attachment attachment = attachmentMapper.toEntity(attachmentDTO);
        attachment = attachmentRepository.save(attachment);
        return attachmentMapper.toDto(attachment);
    }

    /**
     * Partially update a attachment.
     *
     * @param attachmentDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<AttachmentDTO> partialUpdate(AttachmentDTO attachmentDTO) {
        LOG.debug("Request to partially update Attachment : {}", attachmentDTO);

        return attachmentRepository
            .findById(attachmentDTO.getId())
            .map(existingAttachment -> {
                attachmentMapper.partialUpdate(existingAttachment, attachmentDTO);

                return existingAttachment;
            })
            .map(attachmentRepository::save)
            .map(attachmentMapper::toDto);
    }

    /**
     * Get all the attachments.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<AttachmentDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Attachments");
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            return attachmentRepository.findAll(pageable).map(attachmentMapper::toDto);
        }
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        return attachmentRepository.findAllByNoteOwnerLogin(login, pageable).map(attachmentMapper::toDto);
    }

    /**
     * Get all the attachments.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<AttachmentDTO> findAllByNoteId(Pageable pageable, long noteId) {
        LOG.debug("Request to get all Attachments");
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            return attachmentRepository.findAllByNoteId(noteId, pageable).map(attachmentMapper::toDto);
        }
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        return attachmentRepository.findAllByNoteOwnerLoginAndNoteId(login, noteId, pageable).map(attachmentMapper::toDto);
    }

    /**
     * Get one attachment by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<AttachmentDTO> findOne(Long id) {
        LOG.debug("Request to get Attachment : {}", id);
        if (SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)) {
            return attachmentRepository.findById(id).map(attachmentMapper::toDto);
        }
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        return attachmentRepository.findOneByIdAndNoteOwnerLogin(id, login).map(attachmentMapper::toDto);
    }

    /**
     * Delete the attachment by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Attachment : {}", id);
        attachmentRepository.deleteById(id);
    }
}
