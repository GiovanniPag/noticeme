package com.giovannip.noticeme.repository;

import com.giovannip.noticeme.domain.Note;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Note entity.
 *
 * When extending this class, extend NoteRepositoryWithBagRelationships too.
 * For more information refer to https://github.com/jhipster/generator-jhipster/issues/17990.
 */
@Repository
public interface NoteRepository extends NoteRepositoryWithBagRelationships, JpaRepository<Note, Long> {
    @Query("select note from Note note where note.owner.login = ?#{authentication.name}")
    List<Note> findByOwnerIsCurrentUser();

    default Optional<Note> findOneWithEagerRelationships(Long id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default List<Note> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    default Page<Note> findAllWithEagerRelationships(Pageable pageable) {
        return this.fetchBagRelationships(this.findAll(pageable));
    }
}
