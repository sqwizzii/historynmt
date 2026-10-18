package com.nmt.history.imports;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nmt.history.imports.ImportDtos.ImportedQuestion;
import com.nmt.history.imports.ImportDtos.Preview;
import com.nmt.history.model.QuestionType;
import org.junit.jupiter.api.Test;

/**
 * Регресії на реальній HTML-структурі zno.osvita.ua (математика): latex-теги, діаграми, tip 8/13.
 */
class ZnoOsvitaMathImportTest {

    private static String page(String... cards) {
        StringBuilder sb = new StringBuilder("<html><head><title>Математика – ZNO</title></head><body>");
        for (String card : cards) {
            sb.append(card);
        }
        return sb.append("</body></html>").toString();
    }

    @Test
    void elephantMassKeepsDecimalAndDiagram() {
        String card = """
                <div class="task-card" id="q1">
                <form>
                <input type="hidden" name="q[tip]" value="1">
                <div class="question">
                <p>На діаграмі відображено інформацію щодо зміни маси (кг) слона протягом шести місяців із січня до червня цього року в порівнянні з груднем минулого року. Якою стала маса слона в червні, якщо в грудні вона становила <latex>\\(4{,}235\\)</latex> т?</p>
                <p><img alt="" src="/doc/images/znotest/393/39333/os-math-2-2026-01.png" style="width: 580px;" /></p>
                </div>
                <div class="answers">
                <div class="answer"><span class="marker">А</span><latex>\\(4215\\)</latex> кг</div>
                <div class="answer"><span class="marker">Б</span><latex>\\(4235\\)</latex> кг</div>
                <div class="answer"><span class="marker">В</span><latex>\\(4275\\)</latex> кг</div>
                <div class="answer"><span class="marker">Г</span><latex>\\(4295\\)</latex> кг</div>
                <div class="answer"><span class="marker">Д</span><latex>\\(4305\\)</latex> кг</div>
                </div>
                <div class="clear mb10"></div>
                <input type="hidden" name="result" value="d">
                </form></div>
                """;
        Preview preview = ZnoOsvitaParser.parse(page(card), "https://zno.osvita.ua/mathematics/847/");
        assertEquals(1, preview.questions().size());
        ImportedQuestion q = preview.questions().get(0);
        assertEquals(QuestionType.SINGLE_CHOICE, q.questionType());
        assertTrue(q.questionText().contains("4,235 т"), q.questionText());
        assertFalse(q.questionText().contains("\\("), q.questionText());
        assertFalse(q.questionText().contains("{,}"), q.questionText());
        assertEquals("https://zno.osvita.ua/doc/images/znotest/393/39333/os-math-2-2026-01.png", q.imageUrl());
        assertEquals("4295 кг", q.options().get(3).optionText());
        assertTrue(q.options().get(3).isCorrect());
        assertEquals("OK", q.status());
    }

    @Test
    void htmlEntitiesAndNbspDecodedWithoutDuplication() {
        String card = """
                <div class="task-card"><form>
                <input type="hidden" name="q[tip]" value="1">
                <div class="question"><p>Рис.&nbsp;2 на&#x20;прямій <latex>\\(AD\\)</latex>.</p></div>
                <div class="answers">
                <div class="answer"><span class="marker">А</span>Так</div>
                <div class="answer"><span class="marker">Б</span>Ні</div>
                </div>
                <div class="clear mb10"></div>
                <input type="hidden" name="result" value="a">
                </form></div>
                """;
        String text = ZnoOsvitaParser.parse(page(card), "https://zno.osvita.ua/mathematics/1/").questions().get(0).questionText();
        assertEquals("Рис. 2 на прямій AD.", text);
        assertFalse(text.contains("&nbsp;"));
        assertFalse(text.contains("&#"));
    }

    @Test
    void tip13MatchingIsSupported() {
        String card = """
                <div class="task-card"><form>
                <input type="hidden" name="q[tip]" value="13">
                <div class="question"><p>Доберіть закінчення.</p></div>
                <div class="answers col">
                <div class="answer"><span class="marker">1</span>Графіки <latex>\\(y=2x\\)</latex></div>
                <div class="answer"><span class="marker">2</span>Графіки <latex>\\(y=x^2\\)</latex></div>
                </div>
                <div class="answers col">
                <div class="answer"><span class="marker">А</span>не мають спільної точки.</div>
                <div class="answer"><span class="marker">Б</span>мають одну точку.</div>
                <div class="answer"><span class="marker">В</span>зайве.</div>
                </div>
                <div class="clear mb10"></div>
                <input type="hidden" name="result" value="1b;2a">
                </form></div>
                """;
        ImportedQuestion q = ZnoOsvitaParser.parse(page(card), "https://zno.osvita.ua/mathematics/1/").questions().get(0);
        assertEquals(QuestionType.MATCHING, q.questionType());
        assertEquals("OK", q.status());
        assertEquals("мають одну точку.", q.options().get(0).matchKey());
        assertEquals("не мають спільної точки.", q.options().get(1).matchKey());
        assertEquals(java.util.List.of("зайве."), q.extraMatchChoices());
        assertTrue(q.options().get(0).optionText().contains("y=2x"));
    }

    @Test
    void tip8ShortAnswerBecomesFillBlank() {
        String card = """
                <div class="task-card"><form>
                <input type="hidden" name="q[tip]" value="8">
                <div class="question"><p>Критична точка <latex>\\(f(x)=x^2\\)</latex>?</p></div>
                <div class="clear mb10"></div>
                <input type="text" name="a" />
                <span class="otvet" style="display:none;">&nbsp;&nbsp;5</span>
                <input type="hidden" name="result" value="5">
                </form></div>
                """;
        ImportedQuestion q = ZnoOsvitaParser.parse(page(card), "https://zno.osvita.ua/mathematics/1/").questions().get(0);
        assertEquals(QuestionType.FILL_BLANK, q.questionType());
        assertEquals("OK", q.status());
        assertEquals("5", q.options().get(0).optionText());
        assertEquals(0, q.options().get(0).orderIndex());
        assertTrue(q.questionText().contains("f(x)=x²") || q.questionText().contains("f(x)=x^2")
                || q.questionText().contains("f(x)=x2") || q.questionText().contains("x²")
                || q.questionText().contains("x2"));
    }

    @Test
    void summaryWarningCountsSourceTasks() {
        String card = """
                <div class="task-card"><form>
                <input type="hidden" name="q[tip]" value="99">
                <div class="question"><p>Невідомий.</p></div>
                <div class="clear mb10"></div>
                <input type="hidden" name="result" value="">
                </form></div>
                """;
        Preview preview = ZnoOsvitaParser.parse(page(card), "https://zno.osvita.ua/mathematics/1/");
        assertEquals(1, preview.questions().size());
        assertEquals("UNSUPPORTED", preview.questions().get(0).status());
        assertTrue(preview.warnings().get(0).contains("непідтримуваних: 1"));
    }

    @Test
    void optionWithSqrtAndFractionReadable() {
        assertEquals("√(5)", ZnoOsvitaParser.clean("<latex>\\(\\sqrt{5}\\)</latex>"));
        assertEquals("(3)/(10)", ZnoOsvitaParser.clean("<latex>\\(\\dfrac{3}{10}\\)</latex>"));
    }
}
