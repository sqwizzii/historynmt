package com.nmt.history.imports;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class LatexToPlainTextTest {

    @Test
    void ukrainianDecimalCommaFromBracedComma() {
        assertEquals("4,235", LatexToPlainText.convert("\\(4{,}235\\)"));
        assertEquals("1,5", LatexToPlainText.convert("\\(1{,}5\\)"));
    }

    @Test
    void commonSymbolsAndDegrees() {
        assertEquals("∠BKD=128°", LatexToPlainText.convert("\\(\\angle BKD=128^\\circ\\)"));
        assertEquals("2x-1≥0.", LatexToPlainText.convert("\\(2x-1\\ge 0.\\)"));
        assertEquals("√(5)", LatexToPlainText.convert("\\(\\sqrt{5}\\)"));
    }

    @Test
    void fractions() {
        assertEquals("(3)/(10)", LatexToPlainText.convert("\\(\\dfrac{3}{10}\\)"));
        String interval = LatexToPlainText.convert("\\([-\\dfrac 12; +\\infty)\\)");
        assertTrue(interval.contains("(-1)/(2)"), () -> "got: " + interval);
        assertTrue(interval.contains("∞"), () -> "got: " + interval);
    }

    @Test
    void gatherEnvironmentFlattened() {
        String plain = LatexToPlainText.convert("""
                \\begin{gather*}
                        4235\\ \\text{кг}+60\\ \\text{кг}=4295\\ \\text{кг}.
                    \\end{gather*}
                """);
        assertTrue(plain.contains("4235"));
        assertTrue(plain.contains("кг"));
        assertTrue(plain.contains("4295"));
        assertFalse(plain.contains("begin"));
    }

    @Test
    void dollarWrappers() {
        assertEquals("a²+b²", LatexToPlainText.convert("$a^2+b^2$"));
    }
}
