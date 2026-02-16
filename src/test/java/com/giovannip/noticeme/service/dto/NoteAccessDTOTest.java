package com.giovannip.noticeme.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.giovannip.noticeme.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class NoteAccessDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(NoteAccessDTO.class);
        NoteAccessDTO noteAccessDTO1 = new NoteAccessDTO();
        noteAccessDTO1.setId(1L);
        NoteAccessDTO noteAccessDTO2 = new NoteAccessDTO();
        assertThat(noteAccessDTO1).isNotEqualTo(noteAccessDTO2);
        noteAccessDTO2.setId(noteAccessDTO1.getId());
        assertThat(noteAccessDTO1).isEqualTo(noteAccessDTO2);
        noteAccessDTO2.setId(2L);
        assertThat(noteAccessDTO1).isNotEqualTo(noteAccessDTO2);
        noteAccessDTO1.setId(null);
        assertThat(noteAccessDTO1).isNotEqualTo(noteAccessDTO2);
    }
}
