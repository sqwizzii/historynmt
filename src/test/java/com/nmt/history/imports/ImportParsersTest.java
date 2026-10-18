package com.nmt.history.imports;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nmt.history.exception.BadRequestException;
import com.nmt.history.imports.ImportDtos.ImportedQuestion;
import com.nmt.history.imports.ImportDtos.Preview;
import com.nmt.history.model.QuestionType;
import org.junit.jupiter.api.Test;

class ImportParsersTest {

    private static String card(String tip, String question, String answers, String result) {
        return "<div class=\"task-card\"><form><input type=\"hidden\" name=\"q[tip]\" value=\"" + tip + "\">"
                + "<div class=\"question\">" + question + "</div><div class=\"clear\"></div>" + answers
                + "<div class=\"clear mb10\"></div><input type=\"hidden\" name=\"result\" value=\"" + result + "\"></form>";
    }

    private static String block(String... items) {
        StringBuilder sb = new StringBuilder("<div class=\"answers\">");
        for (int i = 0; i < items.length; i += 2) {
            sb.append("<div class=\"answer\"><span class=\"marker\">").append(items[i]).append("</span>").append(items[i + 1]).append("</div>");
        }
        return sb.append("</div>").toString();
    }

    private static final String PAGE = "<html><head><title>Тест 1 – сайт Приклад</title></head><body>"
            + card("1", "<p>Питання про &laquo;щось&raquo;?</p><p><img src=\"/doc/images/a.png\"></p><p><img src=\"/doc/images/b.png\"></p>", block("А", "Один", "Б", "Два", "В", "Три"), "b")
            + card("7", "<p>Оберіть три.</p>", block("1", "<img src=\"https://zno.osvita.ua/doc/i1.png\">", "2", "Два", "3", "Три", "4", "Чотири"), "1;3;4")
            + card("4", "<p>Поєднайте.</p>", block("1", "Лівий 1", "2", "Лівий 2") + block("А", "Правий А", "Б", "Правий Б", "В", "Зайвий"), "1b;2a")
            + card("5", "<p>Упорядкуйте.</p>", block("А", "Подія А", "Б", "Подія Б", "В", "Подія В"), "1c;2a;3b")
            + card("1", "<p>Без ключа.</p>", block("А", "Так", "Б", "Ні"), "")
            + card("99", "<p>Невідомий тип.</p>", block("А", "x"), "a")
            + card("1", "<p>Чуже зображення.</p><p><img src=\"https://evil.example/x.png\"></p>", block("А", "Так", "Б", "Ні"), "a")
            + card("5", "<p>Дубль позиції.</p>", block("А", "A", "Б", "B"), "1a;2a");

    @Test
    void parsesKnownTaskTypesAndFlagsTheRest() {
        Preview preview = ZnoOsvitaParser.parse(PAGE, "https://zno.osvita.ua/test/1/");
        assertEquals("Тест 1", preview.title());
        assertEquals(8, preview.questions().size());

        ImportedQuestion single = preview.questions().get(0);
        assertEquals(QuestionType.SINGLE_CHOICE, single.questionType());
        assertEquals("OK", single.status());
        assertEquals("Питання про «щось»?", single.questionText());
        assertEquals("https://zno.osvita.ua/doc/images/a.png", single.imageUrl());
        assertEquals(java.util.List.of("https://zno.osvita.ua/doc/images/b.png"), single.extraImageUrls());
        assertEquals(1, single.options().stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count());
        assertTrue(single.options().get(1).isCorrect());

        ImportedQuestion multiple = preview.questions().get(1);
        assertEquals(QuestionType.MULTIPLE_CHOICE, multiple.questionType());
        assertEquals(3, multiple.options().stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count());
        assertEquals("Варіант 1", multiple.options().get(0).optionText());
        assertEquals("https://zno.osvita.ua/doc/i1.png", multiple.options().get(0).imageUrl());

        ImportedQuestion matching = preview.questions().get(2);
        assertEquals(QuestionType.MATCHING, matching.questionType());
        assertEquals("OK", matching.status());
        assertEquals("Правий Б", matching.options().get(0).matchKey());
        assertEquals("Правий А", matching.options().get(1).matchKey());
        assertEquals(java.util.List.of("Зайвий"), matching.extraMatchChoices());
        assertFalse(preview.warnings().isEmpty());
        assertTrue(preview.warnings().get(0).contains("Розпізнано: 8"));

        ImportedQuestion chronology = preview.questions().get(3);
        assertEquals(QuestionType.CHRONOLOGY, chronology.questionType());
        assertEquals(2, chronology.options().get(0).orderIndex());
        assertEquals(3, chronology.options().get(1).orderIndex());
        assertEquals(1, chronology.options().get(2).orderIndex());

        assertEquals("NEEDS_REVIEW", preview.questions().get(4).status());
        assertEquals("NEEDS_REVIEW", preview.questions().get(6).status());
        assertTrue(preview.questions().get(6).note().contains("зображень"));
        assertTrue(preview.questions().get(4).options().stream().noneMatch(o -> Boolean.TRUE.equals(o.isCorrect())));
        ImportedQuestion unsupported = preview.questions().get(5);
        assertEquals("UNSUPPORTED", unsupported.status());
        assertNull(unsupported.questionType());
        assertEquals("NEEDS_REVIEW", preview.questions().get(7).status());
    }

    @Test
    void fourRowsWithFiveChoicesKeepTheUnusedChoiceAsDistractor() {
        String page = "<title>Т – с</title>" + card("4", "<p>Поєднайте.</p>",
                block("1", "Л1", "2", "Л2", "3", "Л3", "4", "Л4") + block("А", "Пр А", "Б", "Пр Б", "В", "Пр В", "Г", "Пр Г", "Д", "Пр Д"),
                "1d;2a;3e;4b");
        ImportedQuestion q = ZnoOsvitaParser.parse(page, "https://zno.osvita.ua/t/1/").questions().get(0);
        assertEquals("OK", q.status());
        assertEquals(4, q.options().size());
        assertEquals(java.util.List.of("Пр Г", "Пр А", "Пр Д", "Пр Б"), q.options().stream().map(o -> o.matchKey()).toList());
        assertEquals(java.util.List.of("Пр В"), q.extraMatchChoices());
    }

    @Test
    void emptyOrUnknownPagesProduceAWarningInsteadOfGuessing() {
        Preview preview = ZnoOsvitaParser.parse("<html><title>Інше</title><body>нічого</body></html>", "https://zno.osvita.ua/x/1/");
        assertTrue(preview.questions().isEmpty());
        assertEquals(1, preview.warnings().size());
    }

    @Test
    void textFormatParsesSingleMultipleAndUnmarkedQuestions() {
        Preview preview = TextTestParser.parse("""
                # Мій тест
                1. Столиця Київської Русі?
                А) Київ +
                Б) Львів
                Пояснення: Київ.
                2. Оберіть правильні
                А) Один *
                Б) Два +
                В) Три
                3. Без позначки
                А) x
                Б) y
                4. Лише один варіант
                А) z +
                """);
        assertEquals("Мій тест", preview.title());
        assertEquals(4, preview.questions().size());
        assertEquals(QuestionType.SINGLE_CHOICE, preview.questions().get(0).questionType());
        assertEquals("Київ", preview.questions().get(0).options().get(0).optionText());
        assertEquals("Київ.", preview.questions().get(0).explanation());
        assertEquals(QuestionType.MULTIPLE_CHOICE, preview.questions().get(1).questionType());
        assertEquals("NEEDS_REVIEW", preview.questions().get(2).status());
        assertEquals("UNSUPPORTED", preview.questions().get(3).status());
        assertTrue(TextTestParser.parse("просто текст").warnings().size() == 1);
    }

    @Test
    void urlValidationBlocksSsrfAndUnsupportedSources() {
        SafeHtmlFetcher fetcher = new SafeHtmlFetcher("zno.osvita.ua", 5, 0);
        for (String bad : new String[] {
                "", "   ", "not a url", "http://zno.osvita.ua/ukraine-history/1/", "ftp://zno.osvita.ua/x/1/", "file:///etc/passwd",
                "https://localhost/x/1/", "https://127.0.0.1/x/1/", "https://10.0.0.5/x/1/", "https://169.254.169.254/latest/meta-data/",
                "https://[::1]/x/1/", "https://example.com/x/1/", "https://zno.osvita.ua.evil.com/x/1/",
                "https://zno.osvita.ua@evil.com/x/1/", "https://user:pass@zno.osvita.ua/x/1/", "https://zno.osvita.ua:8443/x/1/",
                "https://zno.osvita.ua/x/1/?a=1", "https://zno.osvita.ua/x/1/#frag"}) {
            assertThrows(BadRequestException.class, () -> fetcher.validate(bad), bad);
        }
    }

    @Test
    void internalAddressesAreRejectedEvenIfSomeoneAllowlistsThem() {
        SafeHtmlFetcher fetcher = new SafeHtmlFetcher("localhost", 5, 0);
        assertThrows(BadRequestException.class, () -> fetcher.validate("https://localhost/x/1/"));
    }
}
