package com.giovannip.noticeme.domain;

import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;

public class NoteAccessTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static NoteAccess getNoteAccessSample1() {
        return new NoteAccess().id(1L);
    }

    public static NoteAccess getNoteAccessSample2() {
        return new NoteAccess().id(2L);
    }

    public static NoteAccess getNoteAccessRandomSampleGenerator() {
        return new NoteAccess().id(longCount.incrementAndGet());
    }
}
