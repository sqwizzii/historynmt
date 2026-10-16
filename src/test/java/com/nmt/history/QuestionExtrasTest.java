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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Кілька зображень питання та зайві варіанти правої колонки: збереження, повторне читання, перевірка відповідей. */
class QuestionExtrasTest extends AbstractApiTest {

    private static final String IMG1 = "https://zno.osvita.ua/doc/images/1.png";
    private static final String IMG2 = "https://zno.osvita.ua/doc/images/2.png";
    private static final String IMG3 = "https://zno.osvita.ua/doc/images/3.png";

    @Autowired
    private InviteCodeService inviteCodes;

    private String teacher;
    private String student;
    private long testId;

    @BeforeEach
    void setUp() throws Exception {
        grantSubscription("teacher");
        teacher = login("teacher", "Teacher123!");
        String name = "ext_" + UUID.randomUUID().toString().substring(0, 8);
        student = body(send(post("/api/auth/register"), null, Map.of("username", name, "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", inviteCodes.current())).andExpect(status().isCreated())).get("token").asText();
        testId = body(send(post("/api/tests/create"), teacher, Map.of("title", "Розширені питання")).andExpect(status().isCreated())).get("id").asLong();
    }

    private Map<String, Object> single(List<String> extraImages) {
        Map<String, Object> q = new HashMap<>(Map.of("testId", testId, "questionText", "Питання з кількома зображеннями",
                "imageUrl", IMG1, "questionType", "SINGLE_CHOICE", "options", List.of(
                        Map.of("optionText", "Так", "isCorrect", true), Map.of("optionText", "Ні", "isCorrect", false))));
        if (extraImages != null) {
            q.put("extraImageUrls", extraImages);
        }
        return q;
    }

    private Map<String, Object> matching(List<String> distractors) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int i = 1; i <= 4; i++) {
            rows.add(Map.of("optionText", "Рядок " + i, "isCorrect", false, "matchKey", "Відповідник " + "абвг".charAt(i - 1)));
        }
        Map<String, Object> q = new HashMap<>(Map.of("testId", testId, "questionText", "Поєднайте", "questionType", "MATCHING", "options", rows));
        if (distractors != null) {
            q.put("extraMatchChoices", distractors);
        }
        return q;
    }

    @Test
    void severalImagesKeepTheirOrderAcrossReadsAndEdits() throws Exception {
        JsonNode created = body(send(post("/api/tests/questions/create"), teacher, single(List.of(IMG2, IMG3)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.extraImageUrls", hasSize(2))));
        long id = created.get("id").asLong();

        send(get("/api/teacher/tests/" + testId), teacher, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].imageUrl", is(IMG1)))
                .andExpect(jsonPath("$.questions[0].extraImageUrls[0]", is(IMG2)))
                .andExpect(jsonPath("$.questions[0].extraImageUrls[1]", is(IMG3)));
        send(get("/api/tests/" + testId), student, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].imageUrl", is(IMG1)))
                .andExpect(jsonPath("$.questions[0].extraImageUrls[0]", is(IMG2)))
                .andExpect(jsonPath("$.questions[0].extraImageUrls[1]", is(IMG3)));

        Map<String, Object> unchanged = single(null);
        send(put("/api/tests/questions/" + id), teacher, unchanged).andExpect(status().isOk())
                .andExpect(jsonPath("$.extraImageUrls", hasSize(2)));
        send(put("/api/tests/questions/" + id), teacher, single(List.of(IMG3, IMG2))).andExpect(status().isOk());
        send(get("/api/teacher/tests/" + testId), teacher, null).andExpect(jsonPath("$.questions[0].extraImageUrls[0]", is(IMG3)))
                .andExpect(jsonPath("$.questions[0].extraImageUrls[1]", is(IMG2)));
        send(put("/api/tests/questions/" + id), teacher, single(List.of())).andExpect(status().isOk());
        send(get("/api/teacher/tests/" + testId), teacher, null).andExpect(jsonPath("$.questions[0].extraImageUrls", hasSize(0)));
    }

    @Test
    void reviewKeepsAllImages() throws Exception {
        JsonNode q = body(send(post("/api/tests/questions/create"), teacher, single(List.of(IMG2))).andExpect(status().isCreated()));
        long right = q.get("options").get(0).get("id").asLong();
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        long resultId = body(send(post("/api/tests/" + testId + "/submit"), student, Map.of("answers", List.of(Map.of(
                "questionId", q.get("id").asLong(), "selectedOptionIds", List.of(right))))).andExpect(status().isOk())
                .andExpect(jsonPath("$.review[0].extraImageUrls[0]", is(IMG2)))).get("id").asLong();
        send(get("/api/results/" + resultId), student, null).andExpect(jsonPath("$.review[0].extraImageUrls[0]", is(IMG2)));
    }

    @Test
    void invalidExtrasAreRejected() throws Exception {
        send(post("/api/tests/questions/create"), teacher, single(List.of("http://zno.osvita.ua/a.png"))).andExpect(status().isBadRequest());
        send(post("/api/tests/questions/create"), teacher, single(List.of("javascript:alert(1)"))).andExpect(status().isBadRequest());
        send(post("/api/tests/questions/create"), teacher, single(java.util.Collections.nCopies(11, IMG2))).andExpect(status().isBadRequest());
        send(post("/api/tests/questions/create"), teacher, matching(List.of("відповідник А"))).andExpect(status().isBadRequest());
        send(post("/api/tests/questions/create"), teacher, matching(List.of("Зайвий", "зайвий "))).andExpect(status().isBadRequest());
        send(post("/api/tests/questions/create"), teacher, matching(List.of(" "))).andExpect(status().isBadRequest());
        Map<String, Object> notMatching = single(null);
        notMatching.put("extraMatchChoices", List.of("Зайвий"));
        send(post("/api/tests/questions/create"), teacher, notMatching).andExpect(status().isBadRequest());
    }

    @Test
    void fourRowsWithFiveChoicesAreStoredShownAndScoredCorrectly() throws Exception {
        JsonNode created = body(send(post("/api/tests/questions/create"), teacher, matching(List.of("Зайвий відповідник д")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.options", hasSize(4)))
                .andExpect(jsonPath("$.extraMatchChoices[0]", is("Зайвий відповідник д"))));
        long id = created.get("id").asLong();

        JsonNode student5 = body(send(get("/api/tests/" + testId), student, null).andExpect(status().isOk())).get("questions").get(0);
        org.junit.jupiter.api.Assertions.assertEquals(4, student5.get("options").size());
        org.junit.jupiter.api.Assertions.assertEquals(5, student5.get("matchChoices").size());
        org.junit.jupiter.api.Assertions.assertTrue(student5.get("matchChoices").toString().contains("Зайвий відповідник д"));
        send(get("/api/teacher/tests/" + testId), teacher, null).andExpect(jsonPath("$.questions[0].extraMatchChoices[0]", is("Зайвий відповідник д")));

        send(put("/api/tests/questions/" + id), teacher, matching(null)).andExpect(status().isOk())
                .andExpect(jsonPath("$.extraMatchChoices", hasSize(1)));

        Map<Long, String> correct = new HashMap<>();
        Map<Long, String> oneWithDistractor = new HashMap<>();
        JsonNode edit = body(send(get("/api/teacher/tests/" + testId), teacher, null)).get("questions").get(0).get("options");
        for (int i = 0; i < 4; i++) {
            long optionId = edit.get(i).get("id").asLong();
            correct.put(optionId, edit.get(i).get("matchKey").asText());
            oneWithDistractor.put(optionId, i == 0 ? "Зайвий відповідник д" : edit.get(i).get("matchKey").asText());
        }
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/submit"), student, Map.of("answers", List.of(Map.of("questionId", id, "matches", correct)))).andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(4)));
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/submit"), student, Map.of("answers", List.of(Map.of("questionId", id, "matches", oneWithDistractor)))).andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(3)));

        Map<String, Object> asSingle = single(null);
        asSingle.put("testId", testId);
        send(put("/api/tests/questions/" + id), teacher, asSingle).andExpect(status().isOk()).andExpect(jsonPath("$.extraMatchChoices", hasSize(0)));
    }

    @Test
    void importedQuestionsKeepImagesAndDistractors() throws Exception {
        Map<String, Object> imported = new HashMap<>(Map.of("questionText", "Імпорт", "questionType", "MATCHING", "status", "OK",
                "imageUrl", IMG1, "extraImageUrls", List.of(IMG2, IMG3), "extraMatchChoices", List.of("Зайвий"), "options", List.of(
                        Map.of("optionText", "Л1", "isCorrect", false, "matchKey", "А"), Map.of("optionText", "Л2", "isCorrect", false, "matchKey", "Б"))));
        long id = body(send(post("/api/teacher/import/create"), teacher, Map.of("title", "Імпорт з додатками", "questions", List.of(imported)))
                .andExpect(status().isCreated())).get("testId").asLong();
        send(get("/api/teacher/tests/" + id), teacher, null).andExpect(jsonPath("$.questions[0].extraImageUrls", hasSize(2)))
                .andExpect(jsonPath("$.questions[0].extraImageUrls[1]", is(IMG3)))
                .andExpect(jsonPath("$.questions[0].extraMatchChoices[0]", is("Зайвий")));
        imported.put("extraImageUrls", List.of("http://insecure/x.png"));
        send(post("/api/teacher/import/create"), teacher, Map.of("title", "Погано", "questions", List.of(imported))).andExpect(status().isBadRequest());
    }
}
