package com.giovannip.noticeme.repository;

import com.giovannip.noticeme.domain.Attachment;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Attachment entity.
 */
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    Page<Attachment> findAllByNoteOwnerLogin(String login, Pageable pageable);

    Optional<Attachment> findOneByIdAndNoteOwnerLogin(@Param("id") Long id, @Param("login") String login);

    Page<Attachment> findAllByNoteId(long noteId, Pageable pageable);

    Page<Attachment> findAllByNoteOwnerLoginAndNoteId(String string, long noteId, Pageable pageable);
}
