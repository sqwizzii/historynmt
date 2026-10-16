package com.nmt.history;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.nmt.history.ai.AiClient;
import com.nmt.history.service.InviteCodeService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

/** Пояснення ШІ: лише для помилок, у дозволений режимом момент, зі збереженням і повторним використанням. */
class AiExplanationTest extends AbstractApiTest {

    @MockBean
    private AiClient ai;
    @MockBean
    private com.nmt.history.ai.AiRateLimiter limiter;
    @Autowired
    private InviteCodeService inviteCodes;

    private String teacher;
    private String student;
    private String studentName;

    @BeforeEach
    void setUp() throws Exception {
        Mockito.reset(ai, limiter);
        when(limiter.tryAcquire(anyString())).thenReturn(true);
        when(ai.isConfigured()).thenReturn(true);
        when(ai.model()).thenReturn("test-model");
        grantSubscription("teacher");
        teacher = login("teacher", "Teacher123!");
        student = newStudent();
    }

    private String newStudent() throws Exception {
        studentName = "ai_" + UUID.randomUUID().toString().substring(0, 8);
        return body(send(post("/api/auth/register"), null, Map.of("username", studentName, "firstName", "Таємне", "lastName", "Прізвище",
                "password", "secret1", "inviteCode", inviteCodes.current())).andExpect(status().isCreated())).get("token").asText();
    }

    private long createTest(String mode) throws Exception {
        return body(send(post("/api/tests/create"), teacher, Map.of("title", "ШІ " + mode, "answerVisibilityMode", mode))
                .andExpect(status().isCreated())).get("id").asLong();
    }

    private JsonNode question(long testId, String explanation) throws Exception {
        Map<String, Object> payload = new java.util.HashMap<>(Map.of("testId", testId, "questionText", "Хто хрестив Русь?",
                "questionType", "SINGLE_CHOICE", "options", List.of(Map.of("optionText", "Володимир", "isCorrect", true),
                        Map.of("optionText", "Ярослав", "isCorrect", false), Map.of("optionText", "Олег", "isCorrect", false))));
        if (explanation != null) {
            payload.put("explanation", explanation);
        }
        return body(send(post("/api/tests/questions/create"), teacher, payload).andExpect(status().isCreated()));
    }

    private long opt(JsonNode q, String text) {
        for (JsonNode o : q.get("options")) {
            if (o.get("optionText").asText().equals(text)) {
                return o.get("id").asLong();
            }
        }
        throw new IllegalStateException(text);
    }

    private void submit(String token, long testId, JsonNode q, String option) throws Exception {
        send(post("/api/tests/" + testId + "/start"), token, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/submit"), token, Map.of("answers", List.of(Map.of("questionId", q.get("id").asLong(),
                "selectedOptionIds", List.of(opt(q, option)))))).andExpect(status().isOk());
    }

    private String url(long testId, JsonNode q) {
        return "/api/tests/" + testId + "/questions/" + q.get("id").asLong() + "/explanation";
    }

    @Test
    void generatesOnceStoresAndReusesForTheSameWrongAnswerAcrossStudents() throws Exception {
        when(ai.complete(anyString(), anyString())).thenReturn(Optional.of("Русь хрестив князь Володимир у 988 році."));
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        send(post(url(testId, q)), student, null).andExpect(status().isForbidden());
        submit(student, testId, q, "Ярослав");
        send(post(url(testId, q)), student, null).andExpect(status().isOk()).andExpect(jsonPath("$.status", is("READY")))
                .andExpect(jsonPath("$.text", is("Русь хрестив князь Володимир у 988 році.")));
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("READY")));
        verify(ai, times(1)).complete(anyString(), anyString());

        String other = newStudent();
        submit(other, testId, q, "Ярослав");
        send(post(url(testId, q)), other, null).andExpect(jsonPath("$.status", is("READY")));
        verify(ai, times(1)).complete(anyString(), anyString());

        String third = newStudent();
        submit(third, testId, q, "Олег");
        send(post(url(testId, q)), third, null).andExpect(jsonPath("$.status", is("READY")));
        verify(ai, times(2)).complete(anyString(), anyString());

        ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
        verify(ai, times(2)).complete(anyString(), prompt.capture());
        prompt.getAllValues().forEach(p -> org.junit.jupiter.api.Assertions.assertFalse(
                p.contains(studentName) || p.contains("Таємне") || p.contains("Прізвище")));
        org.junit.jupiter.api.Assertions.assertTrue(prompt.getAllValues().get(0).contains("Правильна відповідь: Володимир"));
    }

    @Test
    void editingTheQuestionInvalidatesStoredExplanations() throws Exception {
        when(ai.complete(anyString(), anyString())).thenReturn(Optional.of("Пояснення"));
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        submit(student, testId, q, "Ярослав");
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("READY")));
        send(put("/api/tests/questions/" + q.get("id").asLong()), teacher, Map.of("testId", testId, "questionText", "Хто хрестив Русь (змінено)?",
                "questionType", "SINGLE_CHOICE", "options", List.of(Map.of("optionText", "Володимир", "isCorrect", true,
                        "imageUrl", ""), Map.of("optionText", "Ярослав", "isCorrect", false), Map.of("optionText", "Олег", "isCorrect", false))))
                .andExpect(status().isOk());
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("READY")));
        verify(ai, times(2)).complete(anyString(), anyString());
    }

    @Test
    void neverModeNeverCallsAiAndNeverReturnsText() throws Exception {
        long testId = createTest("NEVER");
        JsonNode q = question(testId, null);
        submit(student, testId, q, "Ярослав");
        send(post(url(testId, q)), student, null).andExpect(status().isForbidden());
        verify(ai, never()).complete(anyString(), anyString());
    }

    @Test
    void afterEachModeExplainsOnlyAfterTheAnswerIsChecked() throws Exception {
        when(ai.complete(anyString(), anyString())).thenReturn(Optional.of("Пояснення після перевірки"));
        long testId = createTest("AFTER_EACH_QUESTION");
        JsonNode q = question(testId, null);
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post(url(testId, q)), student, null).andExpect(status().isForbidden());
        send(post("/api/tests/" + testId + "/questions/" + q.get("id").asLong() + "/check"), student,
                Map.of("selectedOptionIds", List.of(opt(q, "Олег")))).andExpect(status().isOk());
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("READY")))
                .andExpect(jsonPath("$.text", is("Пояснення після перевірки")));
        verify(ai, times(1)).complete(anyString(), anyString());
    }

    @Test
    void correctAnswersAndTeacherExplanationsDoNotUseAi() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode plain = question(testId, null);
        JsonNode explained = question(testId, "Пояснення вчителя");
        submit(student, testId, plain, "Володимир");
        send(post(url(testId, plain)), student, null).andExpect(jsonPath("$.status", is("NOT_NEEDED")));
        long testTwo = createTest("AFTER_TEST_COMPLETION");
        JsonNode withTeacherText = question(testTwo, "Пояснення вчителя");
        submit(student, testTwo, withTeacherText, "Олег");
        send(post(url(testTwo, withTeacherText)), student, null).andExpect(jsonPath("$.status", is("TEACHER")))
                .andExpect(jsonPath("$.text", is("Пояснення вчителя")));
        org.junit.jupiter.api.Assertions.assertNotNull(explained);
        verify(ai, never()).complete(anyString(), anyString());
    }

    @Test
    void worksWithoutAiAndFailedGenerationsAreNotCached() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        when(ai.isConfigured()).thenReturn(false);
        submit(student, testId, q, "Ярослав");
        send(post(url(testId, q)), student, null).andExpect(status().isOk()).andExpect(jsonPath("$.status", is("UNAVAILABLE")));
        send(get("/api/results/my"), student, null).andExpect(status().isOk()).andExpect(jsonPath("$[0].score", is(0)));

        when(ai.isConfigured()).thenReturn(true);
        when(ai.complete(anyString(), anyString())).thenReturn(Optional.empty());
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("UNAVAILABLE")));
        when(ai.complete(anyString(), anyString())).thenReturn(Optional.of("Тепер працює"));
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("READY")));
    }

    @Test
    void rateLimitStopsNewGenerationsButStoredExplanationsStillWork() throws Exception {
        when(ai.complete(anyString(), anyString())).thenReturn(Optional.of("Пояснення"));
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        submit(student, testId, q, "Ярослав");
        when(limiter.tryAcquire(anyString())).thenReturn(false);
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("RATE_LIMITED")));
        verify(ai, never()).complete(anyString(), anyString());
        when(limiter.tryAcquire(anyString())).thenReturn(true);
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("READY")));
        when(limiter.tryAcquire(anyString())).thenReturn(false);
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("READY")));
        verify(ai, times(1)).complete(anyString(), anyString());
    }

    @Test
    void accessRulesApply() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        send(post(url(testId, q)), null, null).andExpect(status().isUnauthorized());
        send(post(url(testId, q)), login(ADMIN_USERNAME, ADMIN_PASSWORD), null).andExpect(status().isForbidden());
    }
}
