package com.giovannip.noticeme.service.mapper;

import com.giovannip.noticeme.domain.Attachment;
import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.domain.Tag;
import com.giovannip.noticeme.domain.User;
import com.giovannip.noticeme.service.dto.AttachmentSummaryDTO;
import com.giovannip.noticeme.service.dto.NoteDTO;
import com.giovannip.noticeme.service.dto.TagDTO;
import com.giovannip.noticeme.service.dto.UserDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Note} and its DTO {@link NoteDTO}.
 */
@Mapper(componentModel = "spring")
public interface NoteMapper extends EntityMapper<NoteDTO, Note> {
    @Mapping(target = "owner", source = "owner", qualifiedByName = "userId")
    @Mapping(target = "tags", source = "tags", qualifiedByName = "tagTagNameSet")
    @Mapping(target = "attachments", source = "attachments", qualifiedByName = "attachmentSummarySet")
    NoteDTO toDto(Note s);

    @Mapping(target = "removeTag", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "removeAttachment", ignore = true)
    Note toEntity(NoteDTO noteDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "removeAttachment", ignore = true)
    @Mapping(target = "removeTag", ignore = true)
    void partialUpdate(@MappingTarget Note entity, NoteDTO dto);

    @Named("userId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    UserDTO toDtoUserId(User user);

    @Named("tagTagName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "tagName", source = "tagName")
    @Mapping(target = "color", source = "color")
    TagDTO toDtoTagTagName(Tag tag);

    @Named("tagTagNameSet")
    default Set<TagDTO> toDtoTagTagNameSet(Set<Tag> tag) {
        return tag.stream().map(this::toDtoTagTagName).collect(Collectors.toSet());
    }

    @Named("attachmentSummarySet")
    default Set<AttachmentSummaryDTO> toDtoAttachmentSummarySet(Set<Attachment> attachments) {
        if (attachments == null) {
            return Set.of();
        }
        return attachments.stream().map(this::mapAttachmentSummary).collect(Collectors.toSet());
    }

    private AttachmentSummaryDTO mapAttachmentSummary(Attachment attachment) {
        AttachmentSummaryDTO dto = new AttachmentSummaryDTO();
        dto.setId(attachment.getId());
        dto.setFileName(attachment.getFileName());
        dto.setDataContentType(attachment.getDataContentType());
        dto.setFileSize(attachment.getFileSize());
        return dto;
    }
}
