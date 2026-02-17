package com.giovannip.noticeme.domain;

import static com.giovannip.noticeme.domain.AttachmentTestSamples.*;
import static com.giovannip.noticeme.domain.NoteTestSamples.*;
import static com.giovannip.noticeme.domain.TagTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.giovannip.noticeme.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class NoteTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Note.class);
        Note note1 = getNoteSample1();
        Note note2 = new Note();
        assertThat(note1).isNotEqualTo(note2);

        note2.setId(note1.getId());
        assertThat(note1).isEqualTo(note2);

        note2 = getNoteSample2();
        assertThat(note1).isNotEqualTo(note2);
    }

    @Test
    void attachmentTest() {
        Note note = getNoteRandomSampleGenerator();
        Attachment attachmentBack = getAttachmentRandomSampleGenerator();

        note.addAttachment(attachmentBack);
        assertThat(note.getAttachments()).containsOnly(attachmentBack);
        assertThat(attachmentBack.getNote()).isEqualTo(note);

        note.removeAttachment(attachmentBack);
        assertThat(note.getAttachments()).doesNotContain(attachmentBack);
        assertThat(attachmentBack.getNote()).isNull();

        note.attachments(new HashSet<>(Set.of(attachmentBack)));
        assertThat(note.getAttachments()).containsOnly(attachmentBack);
        assertThat(attachmentBack.getNote()).isEqualTo(note);

        note.setAttachments(new HashSet<>());
        assertThat(note.getAttachments()).doesNotContain(attachmentBack);
        assertThat(attachmentBack.getNote()).isNull();
    }

    @Test
    void tagTest() {
        Note note = getNoteRandomSampleGenerator();
        Tag tagBack = getTagRandomSampleGenerator();

        note.addTag(tagBack);
        assertThat(note.getTags()).containsOnly(tagBack);

        note.removeTag(tagBack);
        assertThat(note.getTags()).doesNotContain(tagBack);

        note.tags(new HashSet<>(Set.of(tagBack)));
        assertThat(note.getTags()).containsOnly(tagBack);

        note.setTags(new HashSet<>());
        assertThat(note.getTags()).doesNotContain(tagBack);
    }
}
