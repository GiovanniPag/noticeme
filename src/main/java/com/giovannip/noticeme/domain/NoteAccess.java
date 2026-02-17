package com.giovannip.noticeme.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.giovannip.noticeme.domain.enumeration.AccessRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A NoteAccess.
 */
@Entity
@Table(name = "note_access")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class NoteAccess implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private AccessRole role;

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "attachments", "owner", "tags" }, allowSetters = true)
    private Note note;

    @ManyToOne(optional = false)
    @NotNull
    private User user;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public NoteAccess id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AccessRole getRole() {
        return this.role;
    }

    public NoteAccess role(AccessRole role) {
        this.setRole(role);
        return this;
    }

    public void setRole(AccessRole role) {
        this.role = role;
    }

    public Note getNote() {
        return this.note;
    }

    public void setNote(Note note) {
        this.note = note;
    }

    public NoteAccess note(Note note) {
        this.setNote(note);
        return this;
    }

    public User getUser() {
        return this.user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public NoteAccess user(User user) {
        this.setUser(user);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof NoteAccess)) {
            return false;
        }
        return getId() != null && getId().equals(((NoteAccess) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "NoteAccess{" +
            "id=" + getId() +
            ", role='" + getRole() + "'" +
            "}";
    }
}
