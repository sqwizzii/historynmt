package com.nmt.history;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.nmt.history.explanation.ExplanationService;
import com.nmt.history.model.AiExplanation;
import com.nmt.history.repository.AiExplanationRepository;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.service.InviteCodeService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

/** Перегляд пояснень: лише з матеріалів питання або збережених раніше, у дозволений режимом момент; без зовнішніх викликів. */
class ExplanationTest extends AbstractApiTest {

    @Autowired
    private InviteCodeService inviteCodes;
    @Autowired
    private ExplanationService explanations;
    @Autowired
    private AiExplanationRepository stored;
    @Autowired
    private QuestionRepository questions;
    @Autowired
    private TransactionTemplate transaction;

    private String teacher;
    private String student;

    @BeforeEach
    void setUp() throws Exception {
        grantSubscription("teacher");
        teacher = login("teacher", "Teacher123!");
        student = newStudent();
    }

    private String newStudent() throws Exception {
        String name = "ex_" + UUID.randomUUID().toString().substring(0, 8);
        return body(send(post("/api/auth/register"), null, Map.of("username", name, "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", inviteCodes.current())).andExpect(status().isCreated())).get("token").asText();
    }

    private long createTest(String mode) throws Exception {
        return body(send(post("/api/tests/create"), teacher, Map.of("title", "Пояснення " + mode, "answerVisibilityMode", mode))
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

    private void storeExplanation(JsonNode q, String wrongAnswer, String text) {
        transaction.executeWithoutResult(s -> {
            var question = questions.findById(q.get("id").asLong()).orElseThrow();
            stored.save(AiExplanation.builder().question(question).contentHash(explanations.contentHash(question))
                    .answerHash(ExplanationService.answerHash("SINGLE_CHOICE", List.of(wrongAnswer))).explanation(text).build());
        });
    }

    @Test
    void reportsNoneWhenNothingWasAddedAndNeverCallsAnything() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        send(post(url(testId, q)), student, null).andExpect(status().isForbidden());
        submit(student, testId, q, "Ярослав");
        send(post(url(testId, q)), student, null).andExpect(status().isOk()).andExpect(jsonPath("$.status", is("NONE")))
                .andExpect(jsonPath("$.text").doesNotExist());
    }

    @Test
    void returnsStoredExplanationsForTheSameQuestionAndWrongAnswerOnly() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        storeExplanation(q, "Ярослав", "Збережене пояснення");
        submit(student, testId, q, "Ярослав");
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("STORED")))
                .andExpect(jsonPath("$.text", is("Збережене пояснення")));
        String other = newStudent();
        submit(other, testId, q, "Олег");
        send(post(url(testId, q)), other, null).andExpect(jsonPath("$.status", is("NONE")));

        send(put("/api/tests/questions/" + q.get("id").asLong()), teacher, Map.of("testId", testId, "questionText", "Змінене питання?",
                "questionType", "SINGLE_CHOICE", "options", List.of(Map.of("optionText", "Володимир", "isCorrect", true),
                        Map.of("optionText", "Ярослав", "isCorrect", false), Map.of("optionText", "Олег", "isCorrect", false))))
                .andExpect(status().isOk());
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("NONE")));
    }

    @Test
    void teacherExplanationAndCorrectAnswersAreHandled() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode withText = question(testId, "Пояснення вчителя");
        JsonNode plain = question(testId, null);
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/submit"), student, Map.of("answers", List.of(
                Map.of("questionId", withText.get("id").asLong(), "selectedOptionIds", List.of(opt(withText, "Олег"))),
                Map.of("questionId", plain.get("id").asLong(), "selectedOptionIds", List.of(opt(plain, "Володимир")))))).andExpect(status().isOk());
        send(post(url(testId, withText)), student, null).andExpect(jsonPath("$.status", is("TEACHER")))
                .andExpect(jsonPath("$.text", is("Пояснення вчителя")));
        send(post(url(testId, plain)), student, null).andExpect(jsonPath("$.status", is("NOT_NEEDED")));
    }

    @Test
    void neverModeNeverReturnsExplanations() throws Exception {
        long testId = createTest("NEVER");
        JsonNode q = question(testId, "Пояснення вчителя");
        storeExplanation(q, "Ярослав", "Збережене пояснення");
        submit(student, testId, q, "Ярослав");
        send(post(url(testId, q)), student, null).andExpect(status().isForbidden());
    }

    @Test
    void afterEachModeExplainsOnlyAfterTheAnswerIsChecked() throws Exception {
        long testId = createTest("AFTER_EACH_QUESTION");
        JsonNode q = question(testId, "Пояснення після перевірки");
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post(url(testId, q)), student, null).andExpect(status().isForbidden());
        send(post("/api/tests/" + testId + "/questions/" + q.get("id").asLong() + "/check"), student,
                Map.of("selectedOptionIds", List.of(opt(q, "Олег")))).andExpect(status().isOk());
        send(post(url(testId, q)), student, null).andExpect(jsonPath("$.status", is("TEACHER")))
                .andExpect(jsonPath("$.text", is("Пояснення після перевірки")));
    }

    @Test
    void accessRulesApply() throws Exception {
        long testId = createTest("AFTER_TEST_COMPLETION");
        JsonNode q = question(testId, null);
        send(post(url(testId, q)), null, null).andExpect(status().isUnauthorized());
        send(post(url(testId, q)), login(ADMIN_USERNAME, ADMIN_PASSWORD), null).andExpect(status().isForbidden());
    }
}
