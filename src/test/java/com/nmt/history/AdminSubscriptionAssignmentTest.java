package com.nmt.history;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.nmt.history.model.Role;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Самореєстрація вчителя, підписки, адмін-API та призначення тестів учням. */
class AdminSubscriptionAssignmentTest extends AbstractApiTest {

    private String admin;

    @BeforeEach
    void setUp() throws Exception {
        admin = login(ADMIN_USERNAME, ADMIN_PASSWORD);
    }

    private String suffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private JsonNode registerTeacher(String username) throws Exception {
        return body(send(post("/api/auth/register-teacher"), null, Map.of("username", username, "firstName", "Олена",
                "lastName", "Вчителька", "password", "teacher-pass-1")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.role", is("TEACHER"))));
    }

    private boolean listed(String token, long testId) throws Exception {
        for (JsonNode test : body(send(get("/api/tests"), token, null))) {
            if (test.get("id").asLong() == testId) {
                return true;
            }
        }
        return false;
    }

    private long idOf(String username) {
        return userRepository.findByUsername(username).orElseThrow().getId();
    }

    @Test
    void teacherCanSelfRegisterButNeedsAnActiveSubscriptionToCreateContent() throws Exception {
        String name = "t_" + suffix();
        String token = registerTeacher(name).get("token").asText();
        send(post("/api/auth/register-teacher"), null, Map.of("username", name, "firstName", "А", "lastName", "Б",
                "password", "teacher-pass-1")).andExpect(status().isConflict());
        send(post("/api/auth/register-teacher"), null, Map.of("username", "x_" + suffix(), "firstName", "А",
                "lastName", "Б", "password", "short", "role", "ADMIN")).andExpect(status().isBadRequest());

        send(get("/api/subscription/me"), token, null).andExpect(status().isOk()).andExpect(jsonPath("$.active", is(false)));
        send(get("/api/subscription/plans"), null, null).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].plan", is("MONTHLY"))).andExpect(jsonPath("$[1].plan", is("YEARLY")))
                .andExpect(jsonPath("$.length()", is(2)));
        send(post("/api/tests/create"), token, Map.of("title", "Без підписки")).andExpect(status().isPaymentRequired());
        send(post("/api/quizlet/create"), token, Map.of("title", "Без підписки")).andExpect(status().isPaymentRequired());
        send(get("/api/tests"), token, null).andExpect(status().isOk());
        send(get("/api/teacher/invite-code"), token, null).andExpect(status().isOk());

        send(post("/api/admin/users/" + idOf(name) + "/subscription"), admin, Map.of("plan", "MONTHLY"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.subscription.active", is(true)))
                .andExpect(jsonPath("$.subscription.plan", is("MONTHLY")));
        send(post("/api/tests/create"), token, Map.of("title", "З підпискою")).andExpect(status().isCreated());

        send(delete("/api/admin/users/" + idOf(name) + "/subscription"), admin, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.subscription.active", is(false)));
        send(post("/api/tests/create"), token, Map.of("title", "Після скасування")).andExpect(status().isPaymentRequired());
    }

    @Test
    void subscriptionsCannotBeGrantedByNonAdminsOrToStudents() throws Exception {
        String name = "t_" + suffix();
        String token = registerTeacher(name).get("token").asText();
        send(post("/api/admin/users/" + idOf(name) + "/subscription"), token, Map.of("plan", "YEARLY")).andExpect(status().isForbidden());
        send(post("/api/admin/users/" + idOf(name) + "/subscription"), null, Map.of("plan", "YEARLY")).andExpect(status().isUnauthorized());
        send(post("/api/admin/users/" + idOf(name) + "/subscription"), admin, Map.of("plan", "FREE")).andExpect(status().isBadRequest());
        long adminId = idOf(ADMIN_USERNAME);
        send(post("/api/admin/users/" + adminId + "/subscription"), admin, Map.of("plan", "YEARLY")).andExpect(status().isBadRequest());
    }

    @Test
    void adminApiIsRestrictedToAdminsAndProtectsAdmins() throws Exception {
        String teacherName = "t_" + suffix();
        String teacher = registerTeacher(teacherName).get("token").asText();
        for (String path : new String[] {"/api/admin/stats", "/api/admin/users", "/api/admin/subjects"}) {
            send(get(path), teacher, null).andExpect(status().isForbidden());
            send(get(path), null, null).andExpect(status().isUnauthorized());
        }
        send(put("/api/admin/users/" + idOf(teacherName) + "/role"), teacher, Map.of("role", "ADMIN")).andExpect(status().isForbidden());

        send(get("/api/admin/stats"), admin, null).andExpect(status().isOk()).andExpect(jsonPath("$.admins").exists());
        long adminId = idOf(ADMIN_USERNAME);
        send(put("/api/admin/users/" + adminId + "/role"), admin, Map.of("role", "ADMIN")).andExpect(status().isForbidden());
        send(put("/api/admin/users/" + adminId + "/role"), admin, Map.of("role", "STUDENT")).andExpect(status().isForbidden());
        send(delete("/api/admin/users/" + adminId), admin, null).andExpect(status().isForbidden());

        JsonNode found = body(send(get("/api/admin/users").param("q", teacherName).param("role", "TEACHER"), admin, null)
                .andExpect(status().isOk()));
        org.junit.jupiter.api.Assertions.assertEquals(1, found.get("items").size());
        org.junit.jupiter.api.Assertions.assertEquals(teacherName, found.get("items").get(0).get("username").asText());
        org.junit.jupiter.api.Assertions.assertFalse(found.toString().contains("password"));
    }

    @Test
    void adminPromotesAnotherAdminAndTheLastAdminCannotBeRemoved() throws Exception {
        String name = "t_" + suffix();
        registerTeacher(name);
        long id = idOf(name);
        send(put("/api/admin/users/" + id + "/role"), admin, Map.of("role", "ADMIN")).andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("ADMIN")));
        String secondAdmin = login(name, "teacher-pass-1");
        send(get("/api/admin/stats"), secondAdmin, null).andExpect(status().isOk());

        long firstAdminId = idOf(ADMIN_USERNAME);
        send(put("/api/admin/users/" + firstAdminId + "/role"), secondAdmin, Map.of("role", "STUDENT")).andExpect(status().isOk());
        send(put("/api/admin/users/" + id + "/role"), admin, Map.of("role", "STUDENT")).andExpect(status().isForbidden());
        send(put("/api/admin/users/" + firstAdminId + "/role"), secondAdmin, Map.of("role", "ADMIN")).andExpect(status().isOk());
        send(delete("/api/admin/users/" + id), admin, null).andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(Role.ADMIN, userRepository.findByUsername(ADMIN_USERNAME).orElseThrow().getRole());
    }

    @Test
    void adminDoesNotDeleteTeachersWithDataButManagesStudents() throws Exception {
        String name = "t_" + suffix();
        String teacher = registerTeacher(name).get("token").asText();
        grantSubscription(name);
        send(post("/api/tests/create"), teacher, Map.of("title", "Є дані")).andExpect(status().isCreated());
        send(delete("/api/admin/users/" + idOf(name)), admin, null).andExpect(status().isConflict());
        send(put("/api/admin/users/" + idOf(name) + "/role"), admin, Map.of("role", "STUDENT")).andExpect(status().isConflict());
    }

    @Test
    void adminManagesSubjectsAndSystemMaterials() throws Exception {
        String slug = "subj-" + suffix();
        long id = body(send(post("/api/admin/subjects"), admin, Map.of("name", "Нова дисципліна", "slug", slug))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.active", is(true)))).get("id").asLong();
        send(post("/api/admin/subjects"), admin, Map.of("name", "Дубль", "slug", slug)).andExpect(status().isConflict());
        send(post("/api/admin/subjects"), admin, Map.of("name", "Погано", "slug", "Bad Slug")).andExpect(status().isBadRequest());
        send(get("/api/subjects"), null, null).andExpect(jsonPath("$[?(@.id==" + id + ")]").exists());

        send(put("/api/admin/subjects/" + id), admin, Map.of("name", "Нова дисципліна 2", "active", false)).andExpect(status().isOk());
        send(get("/api/subjects"), null, null).andExpect(jsonPath("$[?(@.id==" + id + ")]").doesNotExist());
        send(put("/api/admin/subjects/" + id), admin, Map.of("name", "Нова дисципліна 2", "active", true)).andExpect(status().isOk());

        long testId = body(send(post("/api/tests/create"), admin, Map.of("title", "Системний з предметом", "subjectId", id))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.system", is(true)))).get("id").asLong();
        send(delete("/api/admin/subjects/" + id), admin, null).andExpect(status().isConflict());
        send(delete("/api/tests/" + testId), admin, null).andExpect(status().isNoContent());
        send(delete("/api/admin/subjects/" + id), admin, null).andExpect(status().isNoContent());
    }

    @Test
    void assignedTestsAreVisibleOnlyToAssignedStudents() throws Exception {
        String name = "t_" + suffix();
        String teacher = registerTeacher(name).get("token").asText();
        grantSubscription(name);
        String code = body(send(get("/api/teacher/invite-code"), teacher, null)).get("code").asText();
        String s1 = "s1_" + suffix();
        String s2 = "s2_" + suffix();
        String student1 = body(send(post("/api/auth/register"), null, Map.of("username", s1, "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", code)).andExpect(status().isCreated())).get("token").asText();
        String student2 = body(send(post("/api/auth/register"), null, Map.of("username", s2, "firstName", "А", "lastName", "Б",
                "password", "secret1", "inviteCode", code)).andExpect(status().isCreated())).get("token").asText();

        long testId = body(send(post("/api/tests/create"), teacher, Map.of("title", "Призначений"))).get("id").asLong();
        JsonNode q = body(send(post("/api/tests/questions/create"), teacher, Map.of("testId", testId, "questionText", "Q?",
                "questionType", "SINGLE_CHOICE", "options", List.of(Map.of("optionText", "A", "isCorrect", true),
                        Map.of("optionText", "B", "isCorrect", false)))).andExpect(status().isCreated()));
        send(get("/api/tests/" + testId), student2, null).andExpect(status().isOk());

        send(put("/api/teacher/tests/" + testId + "/assignments"), teacher, Map.of("studentIds", List.of(idOf(s1))))
                .andExpect(status().isOk());
        send(get("/api/teacher/tests/" + testId + "/assignments"), teacher, null)
                .andExpect(jsonPath("$.studentIds[0]", is((int) idOf(s1))));
        send(get("/api/tests/" + testId), student1, null).andExpect(status().isOk());
        send(get("/api/tests/" + testId), student2, null).andExpect(status().isNotFound());
        send(post("/api/tests/" + testId + "/start"), student2, null).andExpect(status().isNotFound());
        send(post("/api/tests/" + testId + "/start"), student1, null).andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertFalse(listed(student2, testId));
        org.junit.jupiter.api.Assertions.assertTrue(listed(student1, testId));
        org.junit.jupiter.api.Assertions.assertTrue(listed(teacher, testId));

        send(put("/api/teacher/tests/" + testId + "/assignments"), teacher,
                Map.of("studentIds", List.of(userRepository.findByUsername("teacher").orElseThrow().getId())))
                .andExpect(status().isNotFound());
        String other = registerTeacher("t_" + suffix()).get("token").asText();
        send(put("/api/teacher/tests/" + testId + "/assignments"), other, Map.of("studentIds", List.of()))
                .andExpect(status().isNotFound());
        send(get("/api/teacher/tests/" + testId + "/assignments"), other, null).andExpect(status().isNotFound());

        send(put("/api/teacher/tests/" + testId + "/assignments"), teacher, Map.of("studentIds", List.of())).andExpect(status().isOk());
        send(get("/api/tests/" + testId), student2, null).andExpect(status().isOk());

        send(put("/api/teacher/tests/" + testId + "/assignments"), teacher, Map.of("studentIds", List.of(idOf(s1)))).andExpect(status().isOk());
        send(delete("/api/teacher/students/" + idOf(s1)), teacher, null).andExpect(status().isNoContent());
        send(delete("/api/tests/" + testId), teacher, null).andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertNotNull(q.get("id"));
    }
}
