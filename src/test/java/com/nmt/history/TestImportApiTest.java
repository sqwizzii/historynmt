package com.nmt.history;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.nmt.history.service.InviteCodeService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class TestImportApiTest extends AbstractApiTest {

    /** Тест перевіряє поведінку за замовчуванням незалежно від локальної конфігурації розробника. */
    @org.springframework.test.context.DynamicPropertySource
    static void znoDisabled(org.springframework.test.context.DynamicPropertyRegistry registry) {
        registry.add("app.import.zno-enabled", () -> "false");
    }

    @Autowired
    private InviteCodeService inviteCodes;

    private String teacher;

    private static final String TEXT = "# Імпорт\n1. Питання?\nА) Так +\nБ) Ні\nПояснення: бо так\n2. Багато\nА) a +\nБ) b +\nВ) c\n";

    @BeforeEach
    void setUp() throws Exception {
        grantSubscription("teacher");
        teacher = login("teacher", "Teacher123!");
    }

    private int testCount() throws Exception {
        return body(send(get("/api/tests"), teacher, null)).size();
    }

    @Test
    void previewStoresNothingAndCreateStoresAfterConfirmation() throws Exception {
        int before = testCount();
        JsonNode preview = body(send(post("/api/teacher/import/preview"), teacher, Map.of("source", "TEXT", "text", TEXT))
                .andExpect(status().isOk()).andExpect(jsonPath("$.questions", hasSize(2)))
                .andExpect(jsonPath("$.questions[0].status", is("OK"))).andExpect(jsonPath("$.title", is("Імпорт"))));
        org.junit.jupiter.api.Assertions.assertEquals(before, testCount());

        long id = body(send(post("/api/teacher/import/create"), teacher, Map.of("title", preview.get("title").asText(),
                "answerVisibilityMode", "NEVER", "questions", json.convertValue(preview.get("questions"), Object.class)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.created", is(2)))).get("testId").asLong();
        org.junit.jupiter.api.Assertions.assertEquals(before + 1, testCount());
        send(get("/api/teacher/tests/" + id), teacher, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.questions", hasSize(2))).andExpect(jsonPath("$.answerVisibilityMode", is("NEVER")))
                .andExpect(jsonPath("$.questions[0].explanation", is("бо так")))
                .andExpect(jsonPath("$.questions[1].questionType", is("MULTIPLE_CHOICE")));
    }

    @Test
    void invalidQuestionsAbortCreationAndLeaveNoTest() throws Exception {
        int before = testCount();
        Map<String, Object> bad = Map.of("questionText", "Без відповіді", "questionType", "SINGLE_CHOICE", "status", "NEEDS_REVIEW",
                "options", List.of(Map.of("optionText", "a", "isCorrect", false), Map.of("optionText", "b", "isCorrect", false)));
        send(post("/api/teacher/import/create"), teacher, Map.of("title", "Погано", "questions", List.of(bad))).andExpect(status().isBadRequest());
        Map<String, Object> unsupported = Map.of("questionText", "Тип", "status", "UNSUPPORTED", "options", List.of());
        send(post("/api/teacher/import/create"), teacher, Map.of("title", "Погано", "questions", List.of(unsupported))).andExpect(status().isBadRequest());
        Map<String, Object> badImage = Map.of("questionText", "Q", "questionType", "SINGLE_CHOICE", "imageUrl", "javascript:alert(1)",
                "options", List.of(Map.of("optionText", "a", "isCorrect", true), Map.of("optionText", "b", "isCorrect", false)));
        send(post("/api/teacher/import/create"), teacher, Map.of("title", "Погано", "questions", List.of(badImage))).andExpect(status().isBadRequest());
        send(post("/api/teacher/import/create"), teacher, Map.of("title", "Порожньо", "questions", List.of())).andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(before, testCount());
    }

    @Test
    void urlImportRejectsBadSourcesAndStaysOffByDefault() throws Exception {
        for (String url : new String[] {"", "http://zno.osvita.ua/ukraine-history/848/", "https://localhost/x/1/", "https://example.com/test/1/",
                "https://zno.osvita.ua/ukraine-history/848/?a=1"}) {
            send(post("/api/teacher/import/preview"), teacher, Map.of("source", "URL", "url", url)).andExpect(status().isBadRequest());
        }
        send(post("/api/teacher/import/preview"), teacher, Map.of("source", "URL", "url", "https://zno.osvita.ua/ukraine-history/848/"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("вимкнено")));
        send(post("/api/teacher/import/preview"), teacher, Map.of("source", "FTP", "url", "x")).andExpect(status().isBadRequest());
        send(post("/api/teacher/import/preview"), teacher, Map.of("source", "TEXT", "text", "  ")).andExpect(status().isBadRequest());
    }

    @Test
    void importRequiresATeacherWithSubscription() throws Exception {
        String name = "imp_" + UUID.randomUUID().toString().substring(0, 8);
        String student = body(send(post("/api/auth/register"), null, Map.of("username", name, "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", inviteCodes.current())).andExpect(status().isCreated())).get("token").asText();
        send(post("/api/teacher/import/preview"), student, Map.of("source", "TEXT", "text", TEXT)).andExpect(status().isForbidden());
        send(post("/api/teacher/import/create"), student, Map.of("title", "x", "questions", List.of())).andExpect(status().isForbidden());
        send(post("/api/teacher/import/preview"), null, Map.of("source", "TEXT", "text", TEXT)).andExpect(status().isUnauthorized());
        String fresh = body(send(post("/api/auth/register-teacher"), null, Map.of("username", name + "t", "firstName", "А", "lastName", "Б",
                "password", "teacher-pass-1")).andExpect(status().isCreated())).get("token").asText();
        send(post("/api/teacher/import/preview"), fresh, Map.of("source", "TEXT", "text", TEXT)).andExpect(status().isPaymentRequired());
    }

    @Test
    void longMatchingKeysSurviveImport() throws Exception {
        String longKey = "Довге формулювання відповідника, яке перевищує сто символів і раніше не вміщалося в колонку бази даних. ".repeat(2).strip();
        Map<String, Object> q = Map.of("questionText", "Поєднайте", "questionType", "MATCHING", "status", "OK", "options", List.of(
                Map.of("optionText", "Ліве 1", "isCorrect", false, "matchKey", longKey),
                Map.of("optionText", "Ліве 2", "isCorrect", false, "matchKey", "Коротке")));
        long id = body(send(post("/api/teacher/import/create"), teacher, Map.of("title", "Довгі ключі", "questions", List.of(q)))
                .andExpect(status().isCreated())).get("testId").asLong();
        send(get("/api/teacher/tests/" + id), teacher, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].options[0].matchKey", is(longKey)));
    }
}
