package com.giovannip.noticeme.repository;

import com.giovannip.noticeme.domain.Note;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

/**
 * Utility repository to load bag relationships based on https://vladmihalcea.com/hibernate-multiplebagfetchexception/
 */
public class NoteRepositoryWithBagRelationshipsImpl implements NoteRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String NOTES_PARAMETER = "notes";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<Note> fetchBagRelationships(Optional<Note> note) {
        return note.map(this::fetchTags);
    }

    @Override
    public Page<Note> fetchBagRelationships(Page<Note> notes) {
        return new PageImpl<>(fetchBagRelationships(notes.getContent()), notes.getPageable(), notes.getTotalElements());
    }

    @Override
    public List<Note> fetchBagRelationships(List<Note> notes) {
        return Optional.of(notes).map(this::fetchTags).orElse(Collections.emptyList());
    }

    Note fetchTags(Note result) {
        return entityManager
            .createQuery("select note from Note note left join fetch note.tags where note.id = :id", Note.class)
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<Note> fetchTags(List<Note> notes) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, notes.size()).forEach(index -> order.put(notes.get(index).getId(), index));
        List<Note> result = entityManager
            .createQuery("select note from Note note left join fetch note.tags where note in :notes", Note.class)
            .setParameter(NOTES_PARAMETER, notes)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
