package com.giovannip.noticeme.service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/**
 * A DTO for the {@link com.giovannip.noticeme.domain.Tag} entity.
 */
@Schema(description = "JHipster JDL model for myApp")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class TagDTO implements Serializable {

    private Long id;

    @NotNull
    @Size(min = 1, max = 255)
    private String tagName;

    @Size(max = 20)
    private String color;

    @NotNull
    private UserDTO owner;

    private Set<NoteDTO> notes = new HashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public UserDTO getOwner() {
        return owner;
    }

    public void setOwner(UserDTO owner) {
        this.owner = owner;
    }

    public Set<NoteDTO> getNotes() {
        return notes;
    }

    public void setNotes(Set<NoteDTO> notes) {
        this.notes = notes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof TagDTO)) {
            return false;
        }

        TagDTO tagDTO = (TagDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, tagDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "TagDTO{" +
            "id=" + getId() +
            ", tagName='" + getTagName() + "'" +
            ", color='" + getColor() + "'" +
            ", owner=" + getOwner() +
            ", notes=" + getNotes() +
            "}";
    }
}
