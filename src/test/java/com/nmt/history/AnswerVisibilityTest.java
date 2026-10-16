package com.nmt.history;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

/** Режими показу правильних відповідей: сервер не віддає відповідь раніше дозволеного моменту. */
class AnswerVisibilityTest extends AbstractApiTest {

    @Autowired
    private InviteCodeService inviteCodes;

    private String teacher;
    private String student;

    @BeforeEach
    void setUp() throws Exception {
        grantSubscription("teacher");
        teacher = login("teacher", "Teacher123!");
        String name = "vis_" + UUID.randomUUID().toString().substring(0, 8);
        student = body(send(post("/api/auth/register"), null, Map.of("username", name, "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", inviteCodes.current())).andExpect(status().isCreated())).get("token").asText();
    }

    private long createTest(String mode) throws Exception {
        Map<String, Object> payload = new java.util.HashMap<>(Map.of("title", "Режим " + mode));
        if (mode != null) {
            payload.put("answerVisibilityMode", mode);
        }
        return body(send(post("/api/tests/create"), teacher, payload).andExpect(status().isCreated())).get("id").asLong();
    }

    private JsonNode addQuestion(long testId) throws Exception {
        return body(send(post("/api/tests/questions/create"), teacher, Map.of("testId", testId, "questionText", "Хто?",
                "questionType", "SINGLE_CHOICE", "explanation", "Секретне пояснення", "options", List.of(
                        Map.of("optionText", "Правильна", "isCorrect", true), Map.of("optionText", "Хибна", "isCorrect", false))))
                .andExpect(status().isCreated()));
    }

    private long option(JsonNode question, boolean correct) {
        for (JsonNode o : question.get("options")) {
            if (o.get("isCorrect").asBoolean() == correct) {
                return o.get("id").asLong();
            }
        }
        throw new IllegalStateException();
    }

    private Map<String, Object> answer(long questionId, long optionId) {
        return Map.of("answers", List.of(Map.of("questionId", questionId, "selectedOptionIds", List.of(optionId))));
    }

    @Test
    void modeIsStoredEditableAndOldTestsKeepTheirBehaviour() throws Exception {
        long legacy = createTest(null);
        send(get("/api/teacher/tests/" + legacy), teacher, null).andExpect(jsonPath("$.answerVisibilityMode", is("AFTER_TEST_COMPLETION")));
        for (String mode : new String[] {"AFTER_EACH_QUESTION", "NEVER", "AFTER_TEST_COMPLETION"}) {
            send(put("/api/tests/" + legacy), teacher, Map.of("title", "Режим", "answerVisibilityMode", mode)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.answerVisibilityMode", is(mode)));
            send(get("/api/teacher/tests/" + legacy), teacher, null).andExpect(jsonPath("$.answerVisibilityMode", is(mode)));
        }
        send(put("/api/tests/" + legacy), teacher, Map.of("title", "Без зміни режиму")).andExpect(status().isOk())
                .andExpect(jsonPath("$.answerVisibilityMode", is("AFTER_TEST_COMPLETION")));
        send(post("/api/tests/create"), teacher, Map.of("title", "x", "answerVisibilityMode", "ALWAYS")).andExpect(status().isBadRequest());
    }

    @Test
    void afterCompletionRevealsOnlyAfterSubmitAndCheckIsRefused() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = addQuestion(testId);
        long qid = q.get("id").asLong();
        send(get("/api/tests/" + testId), student, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].options[0].isCorrect").doesNotExist())
                .andExpect(jsonPath("$.questions[0].explanation").doesNotExist());
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/questions/" + qid + "/check"), student,
                Map.of("selectedOptionIds", List.of(option(q, false)))).andExpect(status().isForbidden());
        send(post("/api/tests/" + testId + "/submit"), student, answer(qid, option(q, false))).andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(0))).andExpect(jsonPath("$.review[0].correctAnswer[0]", is("Правильна")))
                .andExpect(jsonPath("$.review[0].explanation", is("Секретне пояснення")));
    }

    @Test
    void neverHidesAnswersAndExplanationsFromStudentsEverywhereButNotFromTeacher() throws Exception {
        long testId = createTest("NEVER");
        JsonNode q = addQuestion(testId);
        long qid = q.get("id").asLong();
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        long resultId = body(send(post("/api/tests/" + testId + "/submit"), student, answer(qid, option(q, false)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.score", is(0)))
                .andExpect(jsonPath("$.review[0].correctAnswer", hasSize(0)))
                .andExpect(jsonPath("$.review[0].explanation").doesNotExist())
                .andExpect(jsonPath("$.review[0].yourAnswer[0]", is("Хибна")))).get("id").asLong();
        send(get("/api/results/" + resultId), student, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.review[0].correctAnswer", hasSize(0)))
                .andExpect(jsonPath("$.review[0].explanation").doesNotExist());
        String raw = send(get("/api/results/" + resultId), student, null).andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertFalse(raw.contains("Секретне") || raw.contains("Правильна"));
        send(get("/api/practice/mistakes"), student, null).andExpect(jsonPath("$.total", is(0)));
        send(get("/api/results/" + resultId), teacher, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.review[0].correctAnswer[0]", is("Правильна")))
                .andExpect(jsonPath("$.review[0].explanation", is("Секретне пояснення")));
    }

    @Test
    void afterEachQuestionChecksOnServerLocksTheAnswerAndScoresIt() throws Exception {
        long testId = createTest("AFTER_EACH_QUESTION");
        JsonNode q = addQuestion(testId);
        long qid = q.get("id").asLong();
        send(post("/api/tests/" + testId + "/questions/" + qid + "/check"), student,
                Map.of("selectedOptionIds", List.of(option(q, true)))).andExpect(status().isBadRequest());
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.checked", hasSize(0)));
        send(post("/api/tests/" + testId + "/questions/" + qid + "/check"), student,
                Map.of("selectedOptionIds", List.of(option(q, false)))).andExpect(status().isOk())
                .andExpect(jsonPath("$.earned", is(0))).andExpect(jsonPath("$.correctAnswer[0]", is("Правильна")))
                .andExpect(jsonPath("$.explanation", is("Секретне пояснення")));
        send(post("/api/tests/" + testId + "/questions/" + qid + "/check"), student,
                Map.of("selectedOptionIds", List.of(option(q, true)))).andExpect(status().isOk())
                .andExpect(jsonPath("$.earned", is(0))).andExpect(jsonPath("$.yourAnswer[0]", is("Хибна")));
        send(post("/api/tests/" + testId + "/start"), student, null)
                .andExpect(jsonPath("$.checked", hasSize(1)));
        send(post("/api/tests/" + testId + "/submit"), student, answer(qid, option(q, true))).andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(0))).andExpect(jsonPath("$.review[0].yourAnswer[0]", is("Хибна")));
        send(get("/api/results/my"), student, null).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void checkRespectsAccessRules() throws Exception {
        long testId = createTest("AFTER_EACH_QUESTION");
        JsonNode q = addQuestion(testId);
        long qid = q.get("id").asLong();
        send(post("/api/tests/" + testId + "/questions/" + qid + "/check"), null, Map.of("selectedOptionIds", List.of(1))).andExpect(status().isUnauthorized());
        send(post("/api/tests/" + testId + "/questions/" + qid + "/check"), login(ADMIN_USERNAME, ADMIN_PASSWORD),
                Map.of("selectedOptionIds", List.of(1))).andExpect(status().isForbidden());
    }
}
