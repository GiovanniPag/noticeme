package com.giovannip.noticeme.service.mapper;

import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.domain.Tag;
import com.giovannip.noticeme.domain.User;
import com.giovannip.noticeme.service.dto.NoteDTO;
import com.giovannip.noticeme.service.dto.TagDTO;
import com.giovannip.noticeme.service.dto.UserDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Tag} and its DTO {@link TagDTO}.
 */
@Mapper(componentModel = "spring")
public interface TagMapper extends EntityMapper<TagDTO, Tag> {
    @Mapping(target = "owner", source = "owner", qualifiedByName = "userId")
    @Mapping(target = "notes", source = "notes", qualifiedByName = "noteSummarySet")
    TagDTO toDto(Tag s);

    @Mapping(target = "notes", ignore = true)
    @Mapping(target = "removeNotes", ignore = true)
    Tag toEntity(TagDTO tagDTO);

    @Named("userId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    UserDTO toDtoUserId(User user);

    @Named("noteSummary")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "title", source = "title")
    @Mapping(target = "status", source = "status")
    NoteDTO toDtoNoteSummary(Note note);

    @Named("noteSummarySet")
    default Set<NoteDTO> toDtoNoteSummarySet(Set<Note> note) {
        return note.stream().map(this::toDtoNoteSummary).collect(Collectors.toSet());
    }
}
