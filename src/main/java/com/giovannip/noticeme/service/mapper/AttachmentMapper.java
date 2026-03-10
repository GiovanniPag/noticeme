package com.giovannip.noticeme.service.mapper;

import com.giovannip.noticeme.domain.Attachment;
import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.service.dto.AttachmentDTO;
import com.giovannip.noticeme.service.dto.AttachmentSummaryDTO;
import com.giovannip.noticeme.service.dto.NoteDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Attachment} and its DTO {@link AttachmentDTO}.
 */
@Mapper(componentModel = "spring")
public interface AttachmentMapper extends EntityMapper<AttachmentDTO, Attachment> {
    @Mapping(target = "note", source = "note", qualifiedByName = "noteId")
    AttachmentDTO toDto(Attachment s);

    @Named("noteId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    NoteDTO toDtoNoteId(Note note);

    @Named("toSummary")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "fileName", source = "fileName")
    @Mapping(target = "dataContentType", source = "dataContentType")
    @Mapping(target = "fileSize", source = "fileSize")
    AttachmentSummaryDTO toSummaryDto(Attachment attachment);
}
