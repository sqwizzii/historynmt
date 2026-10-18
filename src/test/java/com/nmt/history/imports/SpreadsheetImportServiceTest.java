package com.nmt.history.imports;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.nmt.history.dto.QuestionEditResponse;
import com.nmt.history.imports.SpreadsheetImportDtos.PreviewResponse;
import com.nmt.history.model.Test;
import com.nmt.history.model.User;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.service.AccessPolicy;
import com.nmt.history.service.TestService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;

class SpreadsheetImportServiceTest {

    @Mock TestService testService;
    @Mock TestRepository testRepository;
    @Mock AccessPolicy accessPolicy;

    SpreadsheetImportService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new SpreadsheetImportService(testService, testRepository, accessPolicy);
        Test test = Test.builder().id(10L).title("t").timeLimitMinutes(60).build();
        when(testRepository.findById(10L)).thenReturn(Optional.of(test));
        when(accessPolicy.actor("teacher")).thenReturn(User.builder().id(1L).username("teacher").build());
    }

    @org.junit.jupiter.api.Test
    void previewAcceptsValidCsvWithAllTypes() {
        String csv = String.join("\n",
                "type,question,max_points,option1,option2,correct,blanks",
                "SINGLE_CHOICE,Q1,,A,B,2,",
                "FILL_BLANK,Blank Q,,,,,Київ;Kiev|882",
                "OPEN,Open Q,3,,,,");
        MockMultipartFile file = new MockMultipartFile("file", "q.csv", "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
        PreviewResponse preview = service.preview(10L, file, "teacher");
        assertEquals(List.of(), preview.errors(), () -> "errors=" + preview.errors());
        assertTrue(preview.canImport());
        assertEquals(3, preview.questions().size());
    }

    @org.junit.jupiter.api.Test
    void previewReportsRowErrors() {
        String csv = """
                type,question,option1,option2,correct
                SINGLE_CHOICE,Bad,,,
                UNKNOWN,X,A,B,1
                """;
        MockMultipartFile file = new MockMultipartFile("file", "q.csv", "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
        PreviewResponse preview = service.preview(10L, file, "teacher");
        assertFalse(preview.canImport());
        assertFalse(preview.errors().isEmpty());
    }

    @org.junit.jupiter.api.Test
    void importCreatesQuestionsTransactionallyAfterPreviewOk() {
        String csv = """
                type,question,option1,option2,correct
                SINGLE_CHOICE,Q,A,B,1
                """;
        MockMultipartFile file = new MockMultipartFile("file", "q.csv", "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));
        when(testService.createQuestion(any(), eq("teacher")))
                .thenReturn(new QuestionEditResponse(1L, "Q", null, null, null, null, List.of(), null, null));
        var result = service.importQuestions(10L, file, "teacher");
        assertEquals(1, result.imported());
        assertEquals(10L, result.testId());
    }

    @org.junit.jupiter.api.Test
    void splitCsvLineHandlesQuotes() {
        assertEquals(List.of("a", "b,c", "d"), SpreadsheetImportService.splitCsvLine("a,\"b,c\",d"));
    }
}
