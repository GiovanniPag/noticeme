package com.giovannip.noticeme.repository;

import com.giovannip.noticeme.domain.NoteAccess;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the NoteAccess entity.
 */
@Repository
public interface NoteAccessRepository extends JpaRepository<NoteAccess, Long> {
    @Query("select noteAccess from NoteAccess noteAccess where noteAccess.user.login = ?#{authentication.name}")
    List<NoteAccess> findByUserIsCurrentUser();
}
