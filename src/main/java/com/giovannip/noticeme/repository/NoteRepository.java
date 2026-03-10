package com.giovannip.noticeme.repository;

import com.giovannip.noticeme.domain.Note;
import com.giovannip.noticeme.domain.enumeration.NoteStatus;
import java.util.Collection;
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

    Page<Note> findAllByOwnerLogin(String login, Pageable pageable);
    Page<Note> findAllByStatusIn(Collection<NoteStatus> status, Pageable pageable);
    Page<Note> findAllByStatusInAndAlarmDateIsNotNull(Collection<NoteStatus> status, Pageable pageable);
    Page<Note> findAllByOwnerLoginAndStatusIn(String login, Collection<NoteStatus> statuses, Pageable pageable);

    Page<Note> findAllByOwnerLoginAndStatusInAndAlarmDateIsNotNull(String login, Collection<NoteStatus> statuses, Pageable pageable);
    Page<Note> findAllByStatusInOrderByStatusDesc(Collection<NoteStatus> statuses, Pageable pageable);

    Page<Note> findAllByOwnerLoginAndStatusInOrderByStatusDesc(String login, Collection<NoteStatus> statuses, Pageable pageable);
    Optional<Note> findByIdAndOwnerLogin(Long id, String login);
    boolean existsByIdAndOwnerLogin(Long id, String login);

    @Query(
        value = """
        select distinct note
        from Note note
        left join note.owner
        where note.owner.login = :login
        """,
        countQuery = """
        select count(distinct note)
        from Note note
        where note.owner.login = :login
        """
    )
    Page<Note> findAllByOwnerLoginWithPage(String login, Pageable pageable);

    default Optional<Note> findOneWithEagerRelationships(Long id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default Optional<Note> findOneWithEagerRelationshipsAndOwnerLogin(Long id, String login) {
        return this.fetchBagRelationships(this.findByIdAndOwnerLogin(id, login));
    }

    default List<Note> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    default Page<Note> findAllWithEagerRelationships(Pageable pageable) {
        return this.fetchBagRelationships(this.findAll(pageable));
    }

    default Page<Note> findAllWithEagerRelationshipsByOwnerLogin(String login, Pageable pageable) {
        return this.fetchBagRelationships(this.findAllByOwnerLoginWithPage(login, pageable));
    }

    default Page<Note> findAllWithEagerRelationshipsByStatusIn(Collection<NoteStatus> statuses, Pageable pageable) {
        return this.fetchBagRelationships(this.findAllByStatusIn(statuses, pageable));
    }

    default Page<Note> findAllWithEagerRelationshipsByStatusInAndAlarmDateIsNotNull(Collection<NoteStatus> statuses, Pageable pageable) {
        return this.fetchBagRelationships(this.findAllByStatusInAndAlarmDateIsNotNull(statuses, pageable));
    }

    default Page<Note> findAllWithEagerRelationshipsByOwnerLoginAndStatusIn(
        String login,
        Collection<NoteStatus> statuses,
        Pageable pageable
    ) {
        return this.fetchBagRelationships(this.findAllByOwnerLoginAndStatusIn(login, statuses, pageable));
    }

    default Page<Note> findAllWithEagerRelationshipsByOwnerLoginAndStatusInAndAlarmDateIsNotNull(
        String login,
        Collection<NoteStatus> statuses,
        Pageable pageable
    ) {
        return this.fetchBagRelationships(this.findAllByOwnerLoginAndStatusInAndAlarmDateIsNotNull(login, statuses, pageable));
    }
}
