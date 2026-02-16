package com.giovannip.noticeme.domain;

import static com.giovannip.noticeme.domain.AttachmentTestSamples.*;
import static com.giovannip.noticeme.domain.NoteTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.giovannip.noticeme.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class AttachmentTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Attachment.class);
        Attachment attachment1 = getAttachmentSample1();
        Attachment attachment2 = new Attachment();
        assertThat(attachment1).isNotEqualTo(attachment2);

        attachment2.setId(attachment1.getId());
        assertThat(attachment1).isEqualTo(attachment2);

        attachment2 = getAttachmentSample2();
        assertThat(attachment1).isNotEqualTo(attachment2);
    }

    @Test
    void noteTest() {
        Attachment attachment = getAttachmentRandomSampleGenerator();
        Note noteBack = getNoteRandomSampleGenerator();

        attachment.setNote(noteBack);
        assertThat(attachment.getNote()).isEqualTo(noteBack);

        attachment.note(null);
        assertThat(attachment.getNote()).isNull();
    }
}
