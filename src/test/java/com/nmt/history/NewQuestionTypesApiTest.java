package com.nmt.history;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;

class NewQuestionTypesApiTest extends AbstractApiTest {

    @Autowired
    private com.nmt.history.service.InviteCodeService inviteCodes;

    private String teacher() throws Exception {
        grantSubscription("teacher");
        return body(send(post("/api/auth/login"), null, Map.of("username", "teacher", "password", "Teacher123!")))
                .get("token").asText();
    }

    private String student(String name) throws Exception {
        return body(send(post("/api/auth/register"), null, Map.of(
                "username", name, "firstName", "А", "lastName", "Б", "password", "secret1",
                "inviteCode", inviteCodes.current().toLowerCase(), "role", "TEACHER")))
                .get("token").asText();
    }

    @Test
    void fillBlankAndOpenWithManualGrading() throws Exception {
        String teacher = teacher();
        String student = student("new_types_student");

        var create = send(post("/api/tests/create"), teacher, Map.of(
                "title", "New types", "timeLimitMinutes", 20,
                "shuffleQuestions", true, "shuffleOptions", true, "maxAttempts", 2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shuffleQuestions", is(true)))
                .andExpect(jsonPath("$.maxAttempts", is(2)));
        long testId = body(create).get("id").asLong();

        JsonNode blank = body(send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId,
                "questionText", "Столиця — ___",
                "questionType", "FILL_BLANK",
                "options", List.of(
                        Map.of("optionText", "Київ", "orderIndex", 0),
                        Map.of("optionText", "Kiev", "orderIndex", 0))))
                .andExpect(status().isCreated()));

        JsonNode open = body(send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId,
                "questionText", "Поясніть",
                "questionType", "OPEN",
                "maxPoints", 3,
                "options", List.of()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maxPoints", is(3))));

        send(get("/api/tests/" + testId), student, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions", hasSize(2)));

        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        JsonNode result = body(send(post("/api/tests/" + testId + "/submit"), student, Map.of(
                "answers", List.of(
                        Map.of("questionId", blank.get("id").asLong(), "blankAnswers", List.of("київ")),
                        Map.of("questionId", open.get("id").asLong(), "textAnswer", "Моя відповідь"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gradingStatus", is("PENDING_REVIEW")))
                .andExpect(jsonPath("$.pendingManualCount", is(1)))
                .andExpect(jsonPath("$.score", is(1))));

        long resultId = result.get("id").asLong();
        send(post("/api/teacher/results/" + resultId + "/grade"), teacher, Map.of(
                "grades", List.of(Map.of("questionId", open.get("id").asLong(), "earned", 2, "comment", "Добре")),
                "teacherComment", "Загальний коментар",
                "complete", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gradingStatus", is("COMPLETED")))
                .andExpect(jsonPath("$.score", is(3)))
                .andExpect(jsonPath("$.pendingManualCount", is(0)))
                .andExpect(jsonPath("$.teacherComment", is("Загальний коментар")));

        send(get("/api/teacher/tests/" + testId + "/stats"), teacher, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attempts", is(1)))
                .andExpect(jsonPath("$.completed", is(1)));

        send(get("/api/teacher/export/results").param("testId", String.valueOf(testId)).param("format", "csv"),
                teacher, null)
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("masterly-results")));
    }

    @Test
    void maxAttemptsEnforcedOnBackend() throws Exception {
        String teacher = teacher();
        String student = student("attempts_student");
        long testId = body(send(post("/api/tests/create"), teacher, Map.of(
                "title", "Attempts", "timeLimitMinutes", 10, "maxAttempts", 1))
                .andExpect(status().isCreated())).get("id").asLong();
        JsonNode q = body(send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "Q", "questionType", "SINGLE_CHOICE",
                "options", List.of(
                        Map.of("optionText", "A", "isCorrect", true),
                        Map.of("optionText", "B", "isCorrect", false))))
                .andExpect(status().isCreated()));
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/submit"), student, Map.of(
                "answers", List.of(Map.of("questionId", q.get("id").asLong(),
                        "selectedOptionIds", List.of(q.get("options").get(0).get("id").asLong())))))
                .andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isBadRequest());
    }

    @Test
    void copyTestAndSpreadsheetImport() throws Exception {
        String teacher = teacher();
        long testId = body(send(post("/api/tests/create"), teacher, Map.of("title", "Src", "timeLimitMinutes", 15))
                .andExpect(status().isCreated())).get("id").asLong();
        send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "Q", "questionType", "SINGLE_CHOICE",
                "options", List.of(
                        Map.of("optionText", "A", "isCorrect", true),
                        Map.of("optionText", "B", "isCorrect", false))))
                .andExpect(status().isCreated());

        long copyId = body(send(post("/api/tests/" + testId + "/copy"), teacher, null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Src (копія)")))
                .andExpect(jsonPath("$.questionCount", is(1))))
                .get("id").asLong();

        String csv = """
                type,question,option1,option2,correct,blanks
                SINGLE_CHOICE,Imported,Yes,No,1,
                FILL_BLANK,City,,,,Київ
                """;
        MockMultipartFile file = new MockMultipartFile("file", "q.csv", "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
        mvc.perform(multipart("/api/teacher/tests/" + copyId + "/import/spreadsheet/preview")
                        .file(file)
                        .header("Authorization", "Bearer " + teacher))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canImport", is(true)))
                .andExpect(jsonPath("$.questions", hasSize(2)));

        mvc.perform(multipart("/api/teacher/tests/" + copyId + "/import/spreadsheet")
                        .file(new MockMultipartFile("file", "q.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)))
                        .header("Authorization", "Bearer " + teacher))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(2)));

        send(get("/api/teacher/tests/" + copyId), teacher, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions", hasSize(3)));
    }

    @Test
    void studentCannotGradeResults() throws Exception {
        String teacher = teacher();
        String student = student("nograde_student");
        long testId = body(send(post("/api/tests/create"), teacher, Map.of("title", "G", "timeLimitMinutes", 10))
                .andExpect(status().isCreated())).get("id").asLong();
        JsonNode open = body(send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "Open", "questionType", "OPEN", "maxPoints", 2,
                "options", List.of()))
                .andExpect(status().isCreated()));
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        long resultId = body(send(post("/api/tests/" + testId + "/submit"), student, Map.of(
                "answers", List.of(Map.of("questionId", open.get("id").asLong(), "textAnswer", "x"))))
                .andExpect(status().isOk())).get("id").asLong();
        send(post("/api/teacher/results/" + resultId + "/grade"), student, Map.of(
                "grades", List.of(Map.of("questionId", open.get("id").asLong(), "earned", 2)),
                "complete", true)).andExpect(status().isForbidden());
    }
}
