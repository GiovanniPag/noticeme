package com.giovannip.noticeme.service.dto;

import com.giovannip.noticeme.domain.enumeration.AccessRole;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Objects;

/**
 * A DTO for the {@link com.giovannip.noticeme.domain.NoteAccess} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class NoteAccessDTO implements Serializable {

    private Long id;

    @NotNull
    private AccessRole role;

    @NotNull
    private NoteDTO note;

    @NotNull
    private UserDTO user;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AccessRole getRole() {
        return role;
    }

    public void setRole(AccessRole role) {
        this.role = role;
    }

    public NoteDTO getNote() {
        return note;
    }

    public void setNote(NoteDTO note) {
        this.note = note;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof NoteAccessDTO)) {
            return false;
        }

        NoteAccessDTO noteAccessDTO = (NoteAccessDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, noteAccessDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "NoteAccessDTO{" +
            "id=" + getId() +
            ", role='" + getRole() + "'" +
            ", note=" + getNote() +
            ", user=" + getUser() +
            "}";
    }
}
