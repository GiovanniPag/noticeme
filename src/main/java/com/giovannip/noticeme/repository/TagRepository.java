package com.giovannip.noticeme.repository;

import com.giovannip.noticeme.domain.Tag;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Tag entity.
 */
@SuppressWarnings("unused")
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    @Query("select tag from Tag tag where tag.owner.login = ?#{authentication.name}")
    List<Tag> findByOwnerIsCurrentUser();

    List<Tag> findDistinctAllByNotesId(@Param("noteId") Long noteid);

    Page<Tag> findAllByOwnerLogin(String login, Pageable pageable);

    Page<Tag> findDistinctAllByOwnerIdAndTagNameNotInAndTagNameStartingWithOrderByTagNameAsc(
        @Param("ownerId") Long ownerid,
        @Param("notetags") Collection<String> notetagname,
        @Param("initial") String initial,
        Pageable pageable
    );

    Page<Tag> findDistinctAllByOwnerIdAndTagNameStartingWithOrderByTagNameAsc(
        @Param("ownerId") Long ownerid,
        @Param("initial") String initial,
        Pageable pageable
    );
    @EntityGraph(attributePaths = "notes")
    Optional<Tag> findOneWithNotesByIdAndOwnerLogin(Long id, String login);
    @EntityGraph(attributePaths = "notes")
    Optional<Tag> findOneWithNotesById(Long id);
    Optional<Tag> findOneByIdAndOwnerLogin(@Param("id") Long id, @Param("login") String login);

    Optional<Tag> findOneByTagNameAndOwnerLogin(@Param("tagName") String tagName, @Param("login") String login);

    boolean existsByTagNameAndOwnerLogin(@Param("tagName") String tagName, @Param("login") String login);
}
