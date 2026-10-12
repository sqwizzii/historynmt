package com.nmt.history.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class NmtScoreConverterTest {

    private final NmtScoreConverter converter = new NmtScoreConverter();

    @Test
    void mapsRawScoreToRange100To200() {
        assertEquals(100, converter.convert(0, 40));
        assertEquals(150, converter.convert(20, 40));
        assertEquals(200, converter.convert(40, 40));
    }

    @Test
    void handlesDegenerateInput() {
        assertEquals(100, converter.convert(5, 0));
        assertEquals(200, converter.convert(99, 40));
    }
}
