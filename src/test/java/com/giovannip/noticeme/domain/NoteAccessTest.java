package com.giovannip.noticeme.domain;

import static com.giovannip.noticeme.domain.NoteAccessTestSamples.*;
import static com.giovannip.noticeme.domain.NoteTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.giovannip.noticeme.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class NoteAccessTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(NoteAccess.class);
        NoteAccess noteAccess1 = getNoteAccessSample1();
        NoteAccess noteAccess2 = new NoteAccess();
        assertThat(noteAccess1).isNotEqualTo(noteAccess2);

        noteAccess2.setId(noteAccess1.getId());
        assertThat(noteAccess1).isEqualTo(noteAccess2);

        noteAccess2 = getNoteAccessSample2();
        assertThat(noteAccess1).isNotEqualTo(noteAccess2);
    }

    @Test
    void noteTest() {
        NoteAccess noteAccess = getNoteAccessRandomSampleGenerator();
        Note noteBack = getNoteRandomSampleGenerator();

        noteAccess.setNote(noteBack);
        assertThat(noteAccess.getNote()).isEqualTo(noteBack);

        noteAccess.note(null);
        assertThat(noteAccess.getNote()).isNull();
    }
}
