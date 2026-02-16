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
 * Mapper for the entity {@link Note} and its DTO {@link NoteDTO}.
 */
@Mapper(componentModel = "spring")
public interface NoteMapper extends EntityMapper<NoteDTO, Note> {
    @Mapping(target = "owner", source = "owner", qualifiedByName = "userId")
    @Mapping(target = "tags", source = "tags", qualifiedByName = "tagTagNameSet")
    NoteDTO toDto(Note s);

    @Mapping(target = "removeTag", ignore = true)
    Note toEntity(NoteDTO noteDTO);

    @Named("userId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    UserDTO toDtoUserId(User user);

    @Named("tagTagName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "tagName", source = "tagName")
    TagDTO toDtoTagTagName(Tag tag);

    @Named("tagTagNameSet")
    default Set<TagDTO> toDtoTagTagNameSet(Set<Tag> tag) {
        return tag.stream().map(this::toDtoTagTagName).collect(Collectors.toSet());
    }
}
