package com.nmt.history;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class ApiIntegrationTest extends AbstractApiTest {

    @Autowired
    private com.nmt.history.service.InviteCodeService inviteCodes;

    private String registerStudent(String username) throws Exception {
        ResultActions result = send(post("/api/auth/register"), null,
                Map.of("username", username, "firstName", "Іван", "lastName", "Петренко", "password", "secret1", "inviteCode", inviteCodes.current().toLowerCase(), "role", "TEACHER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role", is("STUDENT")));
        return body(result).get("token").asText();
    }

    private String teacherToken() throws Exception {
        grantSubscription("teacher");
        ResultActions result = send(post("/api/auth/login"), null, Map.of("username", "teacher", "password", "Teacher123!"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("TEACHER")));
        return body(result).get("token").asText();
    }

    @Test
    void healthEndpointIsPublicAndDoesNotNeedTheDatabase() throws Exception {
        send(get("/api/health"), null, null).andExpect(status().isOk()).andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    void registrationNeverGrantsTeacherRoleAndBootstrapTeacherCanLogin() throws Exception {
        registerStudent("reg_student");
        teacherToken();
    }

    @Test
    void studentCannotManageContent() throws Exception {
        String student = registerStudent("plain_student");
        send(post("/api/tests/create"), student, Map.of("title", "x")).andExpect(status().isForbidden());
        send(put("/api/tests/1"), student, Map.of("title", "x")).andExpect(status().isForbidden());
        send(delete("/api/tests/1"), student, null).andExpect(status().isForbidden());
        send(get("/api/teacher/students"), student, null).andExpect(status().isForbidden());
        send(post("/api/tests/create"), null, Map.of("title", "x")).andExpect(status().isUnauthorized());
    }

    @Test
    void fullTestFlowWithReviewAndCleanup() throws Exception {
        String teacher = teacherToken();
        String student = registerStudent("flow_student");
        String other = registerStudent("flow_other");

        long testId = body(send(post("/api/tests/create"), teacher,
                Map.of("title", "Flow", "description", "d", "timeLimitMinutes", 30))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.timeLimitMinutes", is(30)))).get("id").asLong();

        JsonNode single = body(send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "Хто?", "questionType", "SINGLE_CHOICE",
                "explanation", "Бо так",
                "options", java.util.List.of(
                        Map.of("optionText", "A", "isCorrect", true),
                        Map.of("optionText", "B", "isCorrect", false))))
                .andExpect(status().isCreated()));
        long singleId = single.get("id").asLong();
        long correctOptionId = single.get("options").get(0).get("id").asLong();

        send(get("/api/tests/" + testId), null, null).andExpect(status().isNotFound());
        send(get("/api/tests/" + testId), student, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions", hasSize(1)))
                .andExpect(jsonPath("$.questions[0].explanation").doesNotExist())
                .andExpect(jsonPath("$.questions[0].options[0].isCorrect").doesNotExist());

        send(post("/api/tests/" + testId + "/submit"), student, Map.of("answers", java.util.List.of()))
                .andExpect(status().isBadRequest());
        send(post("/api/tests/" + testId + "/start"), student, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingSeconds", org.hamcrest.Matchers.greaterThan(0)));
        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/leave"), student, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.leaveCount", is(1)));

        ResultActions submit = send(post("/api/tests/" + testId + "/submit"), student, Map.of("endReason", "LEFT_PAGE", "answers",
                java.util.List.of(Map.of("questionId", singleId, "selectedOptionIds", java.util.List.of(correctOptionId)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(1)))
                .andExpect(jsonPath("$.maxScore", is(1)))
                .andExpect(jsonPath("$.nmtScore", is(200)))
                .andExpect(jsonPath("$.leaveCount", is(1)))
                .andExpect(jsonPath("$.late", is(false)))
                .andExpect(jsonPath("$.endReason", is("LEFT_PAGE")))
                .andExpect(jsonPath("$.review[0].explanation", is("Бо так")))
                .andExpect(jsonPath("$.review[0].correctAnswer[0]", is("A")));
        long resultId = body(submit).get("id").asLong();

        send(get("/api/results/" + resultId), student, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.review[0].yourAnswer[0]", is("A")));
        send(get("/api/results/" + resultId), teacher, null).andExpect(status().isOk());
        send(get("/api/results/" + resultId), other, null).andExpect(status().isNotFound());

        send(put("/api/tests/questions/" + singleId), teacher, Map.of(
                "testId", testId, "questionText", "Хто насправді?", "questionType", "MULTIPLE_CHOICE",
                "options", java.util.List.of(
                        Map.of("optionText", "A", "isCorrect", true),
                        Map.of("optionText", "B", "isCorrect", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionType", is("MULTIPLE_CHOICE")))
                .andExpect(jsonPath("$.options", hasSize(2)));

        send(get("/api/teacher/tests/" + testId), teacher, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].options[1].isCorrect", is(true)));

        send(delete("/api/tests/" + testId), teacher, null).andExpect(status().isNoContent());
        send(get("/api/tests/" + testId), teacher, null).andExpect(status().isNotFound());
        send(get("/api/results/my"), student, null).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void invalidQuestionsAreRejected() throws Exception {
        String teacher = teacherToken();
        long testId = body(send(post("/api/tests/create"), teacher, Map.of("title", "Validation"))).get("id").asLong();
        send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "x", "questionType", "SINGLE_CHOICE",
                "options", java.util.List.of(Map.of("optionText", "a"), Map.of("optionText", "b"))))
                .andExpect(status().isBadRequest());
        send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "x", "imageUrl", "javascript:alert(1)", "questionType", "CHRONOLOGY",
                "options", java.util.List.of(Map.of("optionText", "a", "orderIndex", 1), Map.of("optionText", "b", "orderIndex", 2))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void repeatedFailedLoginsAreThrottled() throws Exception {
        registerStudent("brute_target");
        for (int i = 0; i < 5; i++) {
            send(post("/api/auth/login"), null, Map.of("username", "brute_target", "password", "wrong"))
                    .andExpect(status().isUnauthorized());
        }
        send(post("/api/auth/login"), null, Map.of("username", "brute_target", "password", "secret1"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void passwordChangeAndTeacherManagementOfStudents() throws Exception {
        String teacher = teacherToken();
        String token = registerStudent("pw_student");

        send(put("/api/account/password"), token, Map.of("currentPassword", "bad", "newPassword", "newsecret1"))
                .andExpect(status().isBadRequest());
        send(put("/api/account/password"), token, Map.of("currentPassword", "secret1", "newPassword", "newsecret1"))
                .andExpect(status().isNoContent());
        send(post("/api/auth/login"), null, Map.of("username", "pw_student", "password", "newsecret1"))
                .andExpect(status().isOk());

        JsonNode students = body(send(get("/api/teacher/students"), teacher, null).andExpect(status().isOk()));
        long id = 0;
        for (JsonNode s : students) {
            if (s.get("username").asText().equals("pw_student")) {
                id = s.get("id").asLong();
            }
        }
        send(put("/api/teacher/students/" + id + "/password"), teacher, Map.of("newPassword", "reset123"))
                .andExpect(status().isNoContent());
        send(post("/api/auth/login"), null, Map.of("username", "pw_student", "password", "reset123"))
                .andExpect(status().isOk());
        send(delete("/api/teacher/students/" + id), teacher, null).andExpect(status().isNoContent());
        send(get("/api/teacher/students/" + id + "/results"), teacher, null).andExpect(status().isNotFound());
        send(delete("/api/teacher/students/1"), teacher, null).andExpect(status().isNotFound());
    }

    @Test
    void quizletCrud() throws Exception {
        String teacher = teacherToken();
        long moduleId = body(send(post("/api/quizlet/create"), teacher, Map.of(
                "title", "M", "flashcards", java.util.List.of(Map.of("termOrQuestion", "t", "answerOrDate", "a"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.flashcards[0].id", notNullValue()))).get("id").asLong();
        long cardId = body(send(get("/api/quizlet/" + moduleId), teacher, null)).get("flashcards").get(0).get("id").asLong();

        send(put("/api/quizlet/cards/" + cardId), teacher, Map.of("termOrQuestion", "t2", "answerOrDate", "a2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.termOrQuestion", is("t2")));
        send(put("/api/quizlet/" + moduleId), teacher, Map.of("title", "M2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title", is("M2")));
        send(delete("/api/quizlet/cards/" + cardId), teacher, null).andExpect(status().isNoContent());
        send(delete("/api/quizlet/" + moduleId), teacher, null).andExpect(status().isNoContent());
        send(get("/api/quizlet/" + moduleId), teacher, null).andExpect(status().isNotFound());
    }

    @Test
    void flashcardPhotoIsStoredAndValidated() throws Exception {
        String teacher = teacherToken();
        long moduleId = body(send(post("/api/quizlet/create"), teacher, Map.of("title", "Карти"))).get("id").asLong();
        String photo = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
        send(post("/api/quizlet/" + moduleId + "/cards"), teacher,
                Map.of("termOrQuestion", "Карта", "answerOrDate", "Україна", "imageUrl", photo))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.imageUrl", is(photo)));
        send(post("/api/quizlet/" + moduleId + "/cards"), teacher,
                Map.of("termOrQuestion", "x", "answerOrDate", "y", "imageUrl", "javascript:alert(1)"))
                .andExpect(status().isBadRequest());
        send(get("/api/quizlet/" + moduleId), teacher, null).andExpect(jsonPath("$.flashcards[0].imageUrl", is(photo)));
    }

    @Test
    void registrationRequiresInviteCodeManagedByTeacher() throws Exception {
        Map<String, Object> request = Map.of("username", "invitee", "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", "WRONG123");
        send(post("/api/auth/register"), null, request).andExpect(status().isBadRequest());

        String teacher = teacherToken();
        String student = registerStudent("invite_student");
        send(get("/api/teacher/invite-code"), student, null).andExpect(status().isForbidden());
        send(put("/api/teacher/invite-code"), teacher, Map.of("code", "GROUP2026"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.code", is("GROUP2026")));
        send(put("/api/teacher/invite-code"), teacher, Map.of("code", "ab")).andExpect(status().isBadRequest());
        send(post("/api/auth/register"), null, Map.of("username", "invitee", "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", "group2026")).andExpect(status().isCreated());
        String regenerated = body(send(post("/api/teacher/invite-code/regenerate"), teacher, null)).get("code").asText();
        send(post("/api/auth/register"), null, Map.of("username", "invitee2", "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", "GROUP2026")).andExpect(status().isBadRequest());
        send(get("/api/teacher/invite-code"), teacher, null).andExpect(jsonPath("$.code", is(regenerated)));
    }

    @Test
    void mistakesPracticeAndTeacherStats() throws Exception {
        String teacher = teacherToken();
        String student = registerStudent("practice_student");
        long testId = body(send(post("/api/tests/create"), teacher, Map.of("title", "P"))).get("id").asLong();
        JsonNode question = body(send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "Q?", "questionType", "SINGLE_CHOICE", "topic", "Київська Русь",
                "options", java.util.List.of(Map.of("optionText", "A", "isCorrect", true),
                        Map.of("optionText", "B", "isCorrect", false)))));
        long qid = question.get("id").asLong();
        long right = question.get("options").get(0).get("id").asLong();
        long wrong = question.get("options").get(1).get("id").asLong();

        send(post("/api/tests/" + testId + "/start"), student, null).andExpect(status().isOk());
        send(post("/api/tests/" + testId + "/submit"), student, Map.of("answers",
                java.util.List.of(Map.of("questionId", qid, "selectedOptionIds", java.util.List.of(wrong)))))
                .andExpect(status().isOk());

        send(get("/api/practice/mistakes"), student, null)
                .andExpect(jsonPath("$.total", is(1)))
                .andExpect(jsonPath("$.questions[0].id", is((int) qid)))
                .andExpect(jsonPath("$.questions[0].options[0].isCorrect").doesNotExist());
        send(post("/api/practice/mistakes/check"), student, Map.of("answers",
                java.util.List.of(Map.of("questionId", qid + 999, "selectedOptionIds", java.util.List.of(right)))))
                .andExpect(status().isBadRequest());
        send(post("/api/practice/mistakes/check"), student, Map.of("answers",
                java.util.List.of(Map.of("questionId", qid, "selectedOptionIds", java.util.List.of(wrong)))))
                .andExpect(jsonPath("$.fixed", is(0)));
        send(get("/api/practice/mistakes"), student, null).andExpect(jsonPath("$.total", is(1)));
        send(post("/api/practice/mistakes/check"), student, Map.of("answers",
                java.util.List.of(Map.of("questionId", qid, "selectedOptionIds", java.util.List.of(right)))))
                .andExpect(jsonPath("$.fixed", is(1)))
                .andExpect(jsonPath("$.review[0].correctAnswer[0]", is("A")));
        send(get("/api/practice/mistakes"), student, null).andExpect(jsonPath("$.total", is(0)));

        send(get("/api/results/my/topics"), student, null)
                .andExpect(jsonPath("$[0].topic", is("Київська Русь")))
                .andExpect(jsonPath("$[0].percent", is(0)))
                .andExpect(jsonPath("$[0].answered", is(1)));
        long studentId = body(send(get("/api/teacher/results"), teacher, null)).get(0).get("studentId").asLong();
        send(get("/api/teacher/students/" + studentId + "/topics"), teacher, null).andExpect(status().isOk());
        send(get("/api/teacher/students/" + studentId + "/topics"), student, null).andExpect(status().isForbidden());
        send(get("/api/teacher/tests/" + testId + "/stats"), student, null).andExpect(status().isForbidden());
        send(get("/api/teacher/tests/" + testId + "/stats"), teacher, null)
                .andExpect(jsonPath("$.attempts", is(1)))
                .andExpect(jsonPath("$.questions[0].wrong", is(1)))
                .andExpect(jsonPath("$.questions[0].correctPercent", is(0)));
    }

    @Test
    void questionImageCanBeUploadedAsFile() throws Exception {
        String teacher = teacherToken();
        long testId = body(send(post("/api/tests/create"), teacher, Map.of("title", "Img"))).get("id").asLong();
        String png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        java.util.function.Function<String, Map<String, Object>> payload = image -> Map.of(
                "testId", testId, "questionText", "Q?", "questionType", "SINGLE_CHOICE", "imageUrl", image,
                "options", java.util.List.of(Map.of("optionText", "A", "isCorrect", true), Map.of("optionText", "B", "isCorrect", false)));

        long qid = body(send(post("/api/tests/questions/create"), teacher, payload.apply(png))
                .andExpect(status().isCreated())).get("id").asLong();
        String ownUrl = "/api/tests/questions/" + qid + "/image";

        send(get("/api/tests/" + testId), teacher, null)
                .andExpect(jsonPath("$.questions[0].imageUrl", org.hamcrest.Matchers.startsWith(ownUrl + "?exp=")));
        String signedUrl = body(send(get("/api/tests/" + testId), teacher, null)).get("questions").get(0).get("imageUrl").asText();
        byte[] bytes = mvc.perform(get(signedUrl)).andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType("image/png"))
                .andReturn().getResponse().getContentAsByteArray();
        org.junit.jupiter.api.Assertions.assertTrue(bytes.length > 10);

        mvc.perform(get(ownUrl)).andExpect(status().isNotFound());
        send(put("/api/tests/questions/" + qid), teacher, payload.apply(signedUrl)).andExpect(status().isOk());
        mvc.perform(get(signedUrl)).andExpect(status().isOk());

        send(post("/api/tests/questions/create"), teacher, payload.apply("javascript:alert(1)")).andExpect(status().isBadRequest());

        send(put("/api/tests/questions/" + qid), teacher, payload.apply("")).andExpect(status().isOk());
        mvc.perform(get(signedUrl)).andExpect(status().isNotFound());
    }

    @Test
    void googleFormImportAndOptionImages() throws Exception {
        String teacher = teacherToken();
        String student = registerStudent("import_student");
        String formPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        Map<String, Object> form = Map.of("title", "З Google Forms", "description", "опис", "questions", java.util.List.of(
                Map.of("title", "Радіо", "type", "SINGLE", "explanation", "бо так", "image", formPng, "options", java.util.List.of(
                        Map.of("text", "A", "correct", true), Map.of("text", "B", "correct", false))),
                Map.of("title", "Чекбокси", "help", "оберіть усі", "type", "MULTIPLE", "image", "data:image/svg+xml;base64,AAAA", "options", java.util.List.of(
                        Map.of("text", "A", "correct", true), Map.of("text", "B", "correct", true), Map.of("text", "C", "correct", false))),
                Map.of("title", "Без ключа", "type", "SINGLE", "options", java.util.List.of(
                        Map.of("text", "A", "correct", false), Map.of("text", "B", "correct", false))),
                Map.of("title", "Текст", "type", "TEXT", "options", java.util.List.of())));

        send(post("/api/teacher/import/google-form"), student, form).andExpect(status().isForbidden());
        JsonNode result = body(send(post("/api/teacher/import/google-form"), teacher, form)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(2)))
                .andExpect(jsonPath("$.warnings", hasSize(1)))
                .andExpect(jsonPath("$.skipped", hasSize(2))));
        long testId = result.get("testId").asLong();
        send(get("/api/tests/" + testId), student, null)
                .andExpect(jsonPath("$.title", is("З Google Forms")))
                .andExpect(jsonPath("$.questions", hasSize(2)))
                .andExpect(jsonPath("$.questions[0].imageUrl", org.hamcrest.Matchers.startsWith("/api/tests/questions/")))
                .andExpect(jsonPath("$.questions[1].imageUrl").doesNotExist())
                .andExpect(jsonPath("$.questions[1].questionText", is("Чекбокси\nоберіть усі")));

        send(post("/api/teacher/import/google-form"), teacher, Map.of("title", "Порожній", "questions", java.util.List.of(
                Map.of("title", "Без ключа", "type", "SINGLE", "options", java.util.List.of(
                        Map.of("text", "A", "correct", false), Map.of("text", "B", "correct", false))))))
                .andExpect(status().isBadRequest());

        String png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        long qid = body(send(post("/api/tests/questions/create"), teacher, Map.of(
                "testId", testId, "questionText", "Яка карта?", "questionType", "SINGLE_CHOICE",
                "options", java.util.List.of(
                        Map.of("optionText", "Карта 1", "isCorrect", true, "imageUrl", png),
                        Map.of("optionText", "Карта 2", "isCorrect", false))))
                .andExpect(status().isCreated())).get("id").asLong();
        JsonNode shown = body(send(get("/api/tests/" + testId), student, null)).get("questions").get(2);
        String optionUrl = shown.get("options").get(0).get("imageUrl").asText();
        org.junit.jupiter.api.Assertions.assertTrue(optionUrl.matches("/api/tests/options/\\d+/image\\?exp=\\d+&sig=[A-Za-z0-9_-]+"));
        mvc.perform(get(optionUrl)).andExpect(status().isOk());

        send(put("/api/tests/questions/" + qid), teacher, Map.of(
                "testId", testId, "questionText", "Яка карта?", "questionType", "SINGLE_CHOICE",
                "options", java.util.List.of(
                        Map.of("optionText", "Карта 1", "isCorrect", true, "imageUrl", optionUrl),
                        Map.of("optionText", "Карта 2", "isCorrect", false)))).andExpect(status().isOk());
        JsonNode updated = body(send(get("/api/tests/" + testId), student, null)).get("questions").get(2);
        mvc.perform(get(updated.get("options").get(0).get("imageUrl").asText())).andExpect(status().isOk());
    }
}
