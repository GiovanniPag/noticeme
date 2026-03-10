package com.giovannip.noticeme.service.mapper;

import static com.giovannip.noticeme.domain.NoteAccessAsserts.*;
import static com.giovannip.noticeme.domain.NoteAccessTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class NoteAccessMapperTest {

    private NoteAccessMapper noteAccessMapper;

    @BeforeEach
    void setUp() {
        noteAccessMapper = new NoteAccessMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getNoteAccessSample1();
        var actual = noteAccessMapper.toEntity(noteAccessMapper.toDto(expected));
        assertNoteAccessAllPropertiesEquals(expected, actual);
    }
}
