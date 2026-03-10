package com.giovannip.noticeme.service.mapper;

import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.domain.NoteAccess;
import com.giovannip.noticeme.domain.User;
import com.giovannip.noticeme.service.dto.NoteAccessDTO;
import com.giovannip.noticeme.service.dto.NoteDTO;
import com.giovannip.noticeme.service.dto.UserDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link NoteAccess} and its DTO {@link NoteAccessDTO}.
 */
@Mapper(componentModel = "spring")
public interface NoteAccessMapper extends EntityMapper<NoteAccessDTO, NoteAccess> {
    @Mapping(target = "note", source = "note", qualifiedByName = "noteId")
    @Mapping(target = "user", source = "user", qualifiedByName = "userId")
    NoteAccessDTO toDto(NoteAccess s);

    @Named("noteId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    NoteDTO toDtoNoteId(Note note);

    @Named("userId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    UserDTO toDtoUserId(User user);
}
