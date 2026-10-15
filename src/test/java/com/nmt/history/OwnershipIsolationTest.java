package com.nmt.history;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import com.nmt.history.repository.UserRepository;
import com.nmt.history.service.InviteCodeService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Ізоляція даних між вчителями, права на системні матеріали, підміна id та підписані посилання на зображення. */
class OwnershipIsolationTest extends AbstractApiTest {

    private static final String PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    private static final String PASSWORD = "Isolation-pass-1";

    @Autowired
    private UserRepository users;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private InviteCodeService inviteCodes;
    @Autowired
    private com.nmt.history.repository.SubjectRepository subjectRepository;

    private String teacherA;
    private String teacherB;
    private String admin;
    private User teacherBUser;
    private String studentA;
    private String studentB;
    private long studentAId;
    private long studentBId;

    @BeforeEach
    void setUp() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        teacherA = login("teacher", "Teacher123!");
        admin = login(ADMIN_USERNAME, ADMIN_PASSWORD);

        teacherBUser = users.save(User.builder().username("teacher_b_" + suffix)
                .password(encoder.encode(PASSWORD)).role(Role.TEACHER).build());
        teacherB = login(teacherBUser.getUsername(), PASSWORD);
        grantSubscription("teacher");
        grantSubscription(teacherBUser.getUsername());

        studentA = register("stud_a_" + suffix);
        studentAId = users.findByUsername("stud_a_" + suffix).orElseThrow().getId();
        User b = users.save(User.builder().username("stud_b_" + suffix).password(encoder.encode(PASSWORD))
                .role(Role.STUDENT).teacherId(teacherBUser.getId()).build());
        studentBId = b.getId();
        studentB = login(b.getUsername(), PASSWORD);
    }

    private String register(String username) throws Exception {
        return body(send(post("/api/auth/register"), null,
                Map.of("username", username, "firstName", "Тест", "lastName", "Учень", "password", "secret1",
                        "inviteCode", inviteCodes.current())).andExpect(status().isCreated())).get("token").asText();
    }

    private long createTest(String token, String title) throws Exception {
        return body(send(post("/api/tests/create"), token, Map.of("title", title)).andExpect(status().isCreated()))
                .get("id").asLong();
    }

    private JsonNode createQuestion(String token, long testId, String image) throws Exception {
        java.util.Map<String, Object> payload = new java.util.HashMap<>(Map.of(
                "testId", testId, "questionText", "Q?", "questionType", "SINGLE_CHOICE",
                "options", List.of(Map.of("optionText", "A", "isCorrect", true), Map.of("optionText", "B", "isCorrect", false))));
        if (image != null) {
            payload.put("imageUrl", image);
        }
        return body(send(post("/api/tests/questions/create"), token, payload).andExpect(status().isCreated()));
    }

    private List<Long> ids(JsonNode array) {
        java.util.ArrayList<Long> ids = new java.util.ArrayList<>();
        array.forEach(n -> ids.add(n.get("id").asLong()));
        return ids;
    }

    @Test
    void teacherCannotReadEditOrDeleteAnotherTeachersMaterials() throws Exception {
        long testId = createTest(teacherA, "Приватний тест A");
        JsonNode question = createQuestion(teacherA, testId, null);
        long questionId = question.get("id").asLong();

        send(get("/api/tests/" + testId), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/teacher/tests/" + testId), teacherB, null).andExpect(status().isNotFound());
        send(put("/api/tests/" + testId), teacherB, Map.of("title", "hack")).andExpect(status().isNotFound());
        send(delete("/api/tests/" + testId), teacherB, null).andExpect(status().isNotFound());
        send(post("/api/tests/questions/create"), teacherB, Map.of(
                "testId", testId, "questionText", "Q?", "questionType", "SINGLE_CHOICE",
                "options", List.of(Map.of("optionText", "A", "isCorrect", true), Map.of("optionText", "B", "isCorrect", false))))
                .andExpect(status().isNotFound());
        send(put("/api/tests/questions/" + questionId), teacherB, Map.of(
                "testId", testId, "questionText", "hack", "questionType", "SINGLE_CHOICE",
                "options", List.of(Map.of("optionText", "A", "isCorrect", true), Map.of("optionText", "B", "isCorrect", false))))
                .andExpect(status().isNotFound());
        send(delete("/api/tests/questions/" + questionId), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/teacher/tests/" + testId + "/stats"), teacherB, null).andExpect(status().isNotFound());

        JsonNode listB = body(send(get("/api/tests"), teacherB, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertFalse(ids(listB).contains(testId));
        JsonNode listA = body(send(get("/api/tests"), teacherA, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertTrue(ids(listA).contains(testId));

        send(get("/api/teacher/tests/" + testId), teacherA, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.title", is("Приватний тест A")));
    }

    @Test
    void teacherCannotReadEditOrDeleteAnotherTeachersFlashcardModules() throws Exception {
        long moduleId = body(send(post("/api/quizlet/create"), teacherA, Map.of("title", "Модуль A", "flashcards",
                List.of(Map.of("termOrQuestion", "t", "answerOrDate", "a")))).andExpect(status().isCreated()))
                .get("id").asLong();
        long cardId = body(send(get("/api/quizlet/" + moduleId), teacherA, null)).get("flashcards").get(0).get("id").asLong();

        send(get("/api/quizlet/" + moduleId), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/quizlet/" + moduleId), null, null).andExpect(status().isNotFound());
        send(put("/api/quizlet/" + moduleId), teacherB, Map.of("title", "hack")).andExpect(status().isNotFound());
        send(delete("/api/quizlet/" + moduleId), teacherB, null).andExpect(status().isNotFound());
        send(post("/api/quizlet/" + moduleId + "/cards"), teacherB, Map.of("termOrQuestion", "x", "answerOrDate", "y"))
                .andExpect(status().isNotFound());
        send(put("/api/quizlet/cards/" + cardId), teacherB, Map.of("termOrQuestion", "x", "answerOrDate", "y"))
                .andExpect(status().isNotFound());
        send(delete("/api/quizlet/cards/" + cardId), teacherB, null).andExpect(status().isNotFound());

        JsonNode listB = body(send(get("/api/quizlet"), teacherB, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertFalse(ids(listB).contains(moduleId));
        send(get("/api/quizlet/" + moduleId), studentA, null).andExpect(status().isOk());
        send(get("/api/quizlet/" + moduleId), studentB, null).andExpect(status().isNotFound());
    }

    @Test
    void systemMaterialsAreReadableByEveryoneButEditableOnlyByAdmin() throws Exception {
        long systemTest = createTest(admin, "Системний тест");
        createQuestion(admin, systemTest, null);
        long systemModule = body(send(post("/api/quizlet/create"), admin, Map.of("title", "Системний модуль"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.system", is(true)))).get("id").asLong();

        for (String token : new String[] {teacherA, teacherB, studentA, studentB, null}) {
            send(get("/api/tests/" + systemTest), token, null).andExpect(status().isOk());
            send(get("/api/quizlet/" + systemModule), token, null).andExpect(status().isOk());
            JsonNode list = body(send(get("/api/tests"), token, null).andExpect(status().isOk()));
            org.junit.jupiter.api.Assertions.assertTrue(ids(list).contains(systemTest));
        }
        send(get("/api/teacher/tests/" + systemTest), teacherA, null).andExpect(status().isForbidden());

        for (String teacher : new String[] {teacherA, teacherB}) {
            send(put("/api/tests/" + systemTest), teacher, Map.of("title", "hack")).andExpect(status().isForbidden());
            send(delete("/api/tests/" + systemTest), teacher, null).andExpect(status().isForbidden());
            send(post("/api/tests/questions/create"), teacher, Map.of(
                    "testId", systemTest, "questionText", "Q?", "questionType", "SINGLE_CHOICE",
                    "options", List.of(Map.of("optionText", "A", "isCorrect", true), Map.of("optionText", "B", "isCorrect", false))))
                    .andExpect(status().isForbidden());
            send(put("/api/quizlet/" + systemModule), teacher, Map.of("title", "hack")).andExpect(status().isForbidden());
            send(delete("/api/quizlet/" + systemModule), teacher, null).andExpect(status().isForbidden());
            send(post("/api/quizlet/" + systemModule + "/cards"), teacher, Map.of("termOrQuestion", "x", "answerOrDate", "y"))
                    .andExpect(status().isForbidden());
        }
        for (String student : new String[] {studentA, studentB}) {
            send(put("/api/tests/" + systemTest), student, Map.of("title", "hack")).andExpect(status().isForbidden());
        }
        send(put("/api/tests/" + systemTest), admin, Map.of("title", "Системний тест 2")).andExpect(status().isOk());
        send(get("/api/tests"), teacherA, null).andExpect(status().isOk());
    }

    @Test
    void systemMaterialsAreMarkedReadOnlyForTeachers() throws Exception {
        long systemTest = createTest(admin, "Системний для списку");
        JsonNode list = body(send(get("/api/tests"), teacherA, null).andExpect(status().isOk()));
        for (JsonNode test : list) {
            if (test.get("id").asLong() == systemTest) {
                org.junit.jupiter.api.Assertions.assertTrue(test.get("system").asBoolean());
                org.junit.jupiter.api.Assertions.assertFalse(test.get("editable").asBoolean());
                return;
            }
        }
        org.junit.jupiter.api.Assertions.fail("Системний тест відсутній у списку вчителя");
    }

    @Test
    void adminCannotReachTeachersPrivateMaterialsStudentsOrResults() throws Exception {
        long testId = createTest(teacherA, "Тільки вчителя A");
        send(get("/api/tests/" + testId), admin, null).andExpect(status().isNotFound());
        send(put("/api/tests/" + testId), admin, Map.of("title", "hack")).andExpect(status().isNotFound());
        send(delete("/api/tests/" + testId), admin, null).andExpect(status().isNotFound());
        send(get("/api/teacher/students"), admin, null).andExpect(status().isForbidden());
        send(get("/api/teacher/results"), admin, null).andExpect(status().isForbidden());
        send(post("/api/tests/" + testId + "/start"), admin, null).andExpect(status().isForbidden());
    }

    @Test
    void anonymousUsersSeeOnlySystemMaterials() throws Exception {
        long privateTest = createTest(teacherA, "Приватний анонімам");
        long systemTest = createTest(admin, "Системний анонімам");
        send(get("/api/tests/" + privateTest), null, null).andExpect(status().isNotFound());
        JsonNode list = body(send(get("/api/tests"), null, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertTrue(ids(list).contains(systemTest));
        org.junit.jupiter.api.Assertions.assertFalse(ids(list).contains(privateTest));
        send(get("/api/teacher/students"), null, null).andExpect(status().isUnauthorized());
        send(get("/api/results/my"), null, null).andExpect(status().isUnauthorized());
    }

    @Test
    void studentsTakeOnlyTheirOwnTeachersTestsAndSystemTests() throws Exception {
        long testA = createTest(teacherA, "Для учнів A");
        createQuestion(teacherA, testA, null);
        send(get("/api/tests/" + testA), studentA, null).andExpect(status().isOk());
        send(post("/api/tests/" + testA + "/start"), studentA, null).andExpect(status().isOk());

        send(get("/api/tests/" + testA), studentB, null).andExpect(status().isNotFound());
        send(post("/api/tests/" + testA + "/start"), studentB, null).andExpect(status().isNotFound());
        send(post("/api/tests/" + testA + "/leave"), studentB, null).andExpect(status().isNotFound());
        send(post("/api/tests/" + testA + "/submit"), studentB, Map.of("answers", List.of(Map.of(
                "questionId", 1, "selectedOptionIds", List.of(1))))).andExpect(status().isNotFound());

        long systemTest = createTest(admin, "Системний для проходження");
        createQuestion(admin, systemTest, null);
        send(post("/api/tests/" + systemTest + "/start"), studentA, null).andExpect(status().isOk());
        send(post("/api/tests/" + systemTest + "/start"), studentB, null).andExpect(status().isOk());
    }

    @Test
    void resultsAndStudentsCannotBeReachedBySubstitutingIds() throws Exception {
        long testId = createTest(teacherA, "Результати A");
        JsonNode question = createQuestion(teacherA, testId, null);
        long optionId = question.get("options").get(0).get("id").asLong();
        send(post("/api/tests/" + testId + "/start"), studentA, null).andExpect(status().isOk());
        long resultId = body(send(post("/api/tests/" + testId + "/submit"), studentA, Map.of("answers", List.of(Map.of(
                "questionId", question.get("id").asLong(), "selectedOptionIds", List.of(optionId)))))
                .andExpect(status().isOk())).get("id").asLong();

        send(get("/api/results/" + resultId), studentA, null).andExpect(status().isOk());
        send(get("/api/results/" + resultId), teacherA, null).andExpect(status().isOk());
        send(get("/api/results/" + resultId), studentB, null).andExpect(status().isNotFound());
        send(get("/api/results/" + resultId), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/results/" + resultId), admin, null).andExpect(status().isForbidden());

        JsonNode resultsB = body(send(get("/api/teacher/results"), teacherB, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertFalse(ids(resultsB).contains(resultId));
        JsonNode studentsB = body(send(get("/api/teacher/students"), teacherB, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertFalse(ids(studentsB).contains(studentAId));
        org.junit.jupiter.api.Assertions.assertTrue(ids(studentsB).contains(studentBId));
        JsonNode studentsA = body(send(get("/api/teacher/students"), teacherA, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertTrue(ids(studentsA).contains(studentAId));
        org.junit.jupiter.api.Assertions.assertFalse(ids(studentsA).contains(studentBId));

        send(get("/api/teacher/students/" + studentAId + "/results"), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/teacher/students/" + studentAId + "/topics"), teacherB, null).andExpect(status().isNotFound());
        send(put("/api/teacher/students/" + studentAId + "/password"), teacherB, Map.of("newPassword", "hacked123"))
                .andExpect(status().isNotFound());
        send(delete("/api/teacher/students/" + studentAId), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/teacher/tests/" + testId + "/stats"), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/teacher/students/" + studentAId + "/results"), teacherA, null).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        send(post("/api/auth/login"), null, Map.of("username", users.findById(studentAId).orElseThrow().getUsername(),
                "password", "secret1")).andExpect(status().isOk());
    }

    @Test
    void statsOfASystemTestShowOnlyTheTeachersOwnStudents() throws Exception {
        long systemTest = createTest(admin, "Системний для статистики");
        JsonNode question = createQuestion(admin, systemTest, null);
        long optionId = question.get("options").get(0).get("id").asLong();
        for (String student : new String[] {studentA, studentB}) {
            send(post("/api/tests/" + systemTest + "/start"), student, null).andExpect(status().isOk());
            send(post("/api/tests/" + systemTest + "/submit"), student, Map.of("answers", List.of(Map.of(
                    "questionId", question.get("id").asLong(), "selectedOptionIds", List.of(optionId)))))
                    .andExpect(status().isOk());
        }
        send(get("/api/teacher/tests/" + systemTest + "/stats"), teacherA, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.attempts", is(1)));
        send(get("/api/teacher/tests/" + systemTest + "/stats"), teacherB, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.attempts", is(1)));
    }

    @Test
    void clientSuppliedOwnerAndRoleAreIgnored() throws Exception {
        long id = body(send(post("/api/tests/create"), teacherA, Map.of("title", "Підміна власника",
                "ownerId", teacherBUser.getId(), "owner_id", teacherBUser.getId(), "role", "ADMIN", "system", true))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.system", is(false)))
                .andExpect(jsonPath("$.editable", is(true)))).get("id").asLong();
        send(get("/api/tests/" + id), teacherB, null).andExpect(status().isNotFound());
        send(get("/api/tests/" + id), teacherA, null).andExpect(status().isOk());

        long moduleId = body(send(post("/api/quizlet/create"), teacherA, Map.of("title", "Підміна модуля",
                "ownerId", teacherBUser.getId())).andExpect(status().isCreated())
                .andExpect(jsonPath("$.system", is(false)))).get("id").asLong();
        send(get("/api/quizlet/" + moduleId), teacherB, null).andExpect(status().isNotFound());

        send(post("/api/tests/create"), studentA, Map.of("title", "x")).andExpect(status().isForbidden());
        send(post("/api/quizlet/create"), studentA, Map.of("title", "x")).andExpect(status().isForbidden());
    }

    @Test
    void registrationCanNeverProduceAnAdminOrTeacher() throws Exception {
        for (String role : new String[] {"ADMIN", "TEACHER"}) {
            String username = "sneaky_" + role.toLowerCase() + "_" + UUID.randomUUID().toString().substring(0, 6);
            send(post("/api/auth/register"), null, Map.of("username", username, "firstName", "А", "lastName", "Б",
                    "password", "secret1", "inviteCode", inviteCodes.current(), "role", role, "teacherId", 1))
                    .andExpect(status().isCreated()).andExpect(jsonPath("$.role", is("STUDENT")));
            org.junit.jupiter.api.Assertions.assertEquals(Role.STUDENT, users.findByUsername(username).orElseThrow().getRole());
        }
    }

    @Test
    void everyTeacherHasAnIndependentInviteCodeAndStudentsJoinTheRightTeacher() throws Exception {
        String codeA = body(send(get("/api/teacher/invite-code"), teacherA, null).andExpect(status().isOk())).get("code").asText();
        String codeB = body(send(get("/api/teacher/invite-code"), teacherB, null).andExpect(status().isOk())).get("code").asText();
        org.junit.jupiter.api.Assertions.assertNotEquals(codeA, codeB);
        send(get("/api/teacher/invite-code"), studentA, null).andExpect(status().isForbidden());
        send(put("/api/teacher/invite-code"), teacherB, Map.of("code", codeA)).andExpect(status().isConflict());

        String joined = "joined_" + UUID.randomUUID().toString().substring(0, 6);
        send(post("/api/auth/register"), null, Map.of("username", joined, "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", codeB)).andExpect(status().isCreated());
        org.junit.jupiter.api.Assertions.assertEquals(teacherBUser.getId(), users.findByUsername(joined).orElseThrow().getTeacherId());
        JsonNode studentsB = body(send(get("/api/teacher/students"), teacherB, null));
        org.junit.jupiter.api.Assertions.assertTrue(studentsB.toString().contains(joined));
        org.junit.jupiter.api.Assertions.assertFalse(body(send(get("/api/teacher/students"), teacherA, null)).toString().contains(joined));

        String regenerated = body(send(post("/api/teacher/invite-code/regenerate"), teacherB, null)).get("code").asText();
        org.junit.jupiter.api.Assertions.assertNotEquals(codeB, regenerated);
        send(post("/api/auth/register"), null, Map.of("username", joined + "x", "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", codeB)).andExpect(status().isBadRequest());
    }

    @Test
    void privateImagesRequireAValidSignature() throws Exception {
        long testId = createTest(teacherA, "Зображення A");
        long questionId = createQuestion(teacherA, testId, PNG).get("id").asLong();
        String path = "/api/tests/questions/" + questionId + "/image";

        String signed = body(send(get("/api/tests/" + testId), studentA, null).andExpect(status().isOk()))
                .get("questions").get(0).get("imageUrl").asText();
        org.junit.jupiter.api.Assertions.assertTrue(signed.startsWith(path + "?exp="));
        mvc.perform(get(signed)).andExpect(status().isOk());

        mvc.perform(get(path)).andExpect(status().isNotFound());
        mvc.perform(get(path).param("exp", "9999999999").param("sig", "AAAA")).andExpect(status().isNotFound());
        String exp = signed.replaceAll(".*exp=(\\d+).*", "$1");
        String sig = signed.replaceAll(".*sig=", "");
        mvc.perform(get(path).param("exp", String.valueOf(Long.parseLong(exp) + 3600)).param("sig", sig))
                .andExpect(status().isNotFound());
        mvc.perform(get(path).param("exp", "1").param("sig", sig)).andExpect(status().isNotFound());
        mvc.perform(get(path).param("exp", "abc").param("sig", sig)).andExpect(status().isNotFound());

        long otherQuestion = createQuestion(teacherB, createTest(teacherB, "Зображення B"), PNG).get("id").asLong();
        mvc.perform(get("/api/tests/questions/" + otherQuestion + "/image").param("exp", exp).param("sig", sig))
                .andExpect(status().isNotFound());

        long systemTest = createTest(admin, "Системні зображення");
        long systemQuestion = createQuestion(admin, systemTest, PNG).get("id").asLong();
        mvc.perform(get("/api/tests/questions/" + systemQuestion + "/image")).andExpect(status().isOk());
    }

    @Test
    void signedImageUrlOfAReviewIsNotRevealedToOtherStudents() throws Exception {
        long testId = createTest(teacherA, "Зображення в розборі");
        JsonNode question = createQuestion(teacherA, testId, PNG);
        long optionId = question.get("options").get(0).get("id").asLong();
        send(post("/api/tests/" + testId + "/start"), studentA, null).andExpect(status().isOk());
        long resultId = body(send(post("/api/tests/" + testId + "/submit"), studentA, Map.of("answers", List.of(Map.of(
                "questionId", question.get("id").asLong(), "selectedOptionIds", List.of(optionId)))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.review[0].imageUrl").exists())).get("id").asLong();
        String reviewImage = body(send(get("/api/results/" + resultId), studentA, null)).get("review").get(0).get("imageUrl").asText();
        org.junit.jupiter.api.Assertions.assertTrue(reviewImage.contains("?exp=") && reviewImage.contains("&sig="));
        mvc.perform(get(reviewImage)).andExpect(status().isOk());
        send(get("/api/results/" + resultId), studentB, null).andExpect(status().isNotFound());
    }

    @Test
    void subjectsAreListedAndMaterialsStoreSubjectGradeAndScale() throws Exception {
        long subjectId = subjectRepository.save(com.nmt.history.model.Subject.builder()
                .slug("test-" + UUID.randomUUID()).name("Тестовий предмет").build()).getId();
        JsonNode subjects = body(send(get("/api/subjects"), null, null).andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertTrue(ids(subjects).contains(subjectId));
        long id = body(send(post("/api/tests/create"), teacherA, Map.of("title", "Предмет", "subjectId", subjectId,
                "grade", 7, "scoringScale", "PERCENT")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.subjectId", is((int) subjectId)))
                .andExpect(jsonPath("$.grade", is(7)))
                .andExpect(jsonPath("$.scoringScale", is("PERCENT")))).get("id").asLong();
        send(get("/api/tests/" + id), teacherA, null).andExpect(jsonPath("$.scoringScale", is("PERCENT")));
        send(post("/api/tests/create"), teacherA, Map.of("title", "Клас", "grade", 12)).andExpect(status().isBadRequest());
        send(post("/api/tests/create"), teacherA, Map.of("title", "Предмет", "subjectId", 999999))
                .andExpect(status().isBadRequest());
    }

    @Test
    void percentScaleTestsDoNotGetAnNmtScoreButNmtTestsDo() throws Exception {
        long percentTest = body(send(post("/api/tests/create"), teacherA, Map.of("title", "Відсотки", "scoringScale", "PERCENT"))
                .andExpect(status().isCreated())).get("id").asLong();
        JsonNode question = createQuestion(teacherA, percentTest, null);
        long optionId = question.get("options").get(0).get("id").asLong();
        send(post("/api/tests/" + percentTest + "/start"), studentA, null).andExpect(status().isOk());
        send(post("/api/tests/" + percentTest + "/submit"), studentA, Map.of("answers", List.of(Map.of(
                "questionId", question.get("id").asLong(), "selectedOptionIds", List.of(optionId)))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.score", is(1)))
                .andExpect(jsonPath("$.nmtScore").doesNotExist());
    }
}
