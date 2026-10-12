package com.nmt.history.controller;

import com.nmt.history.dto.AttemptResponse;
import com.nmt.history.dto.CreateQuestionRequest;
import com.nmt.history.dto.CreateTestRequest;
import com.nmt.history.dto.QuestionEditResponse;
import com.nmt.history.dto.TestDetailResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.dto.TestSubmitRequest;
import com.nmt.history.dto.TestSummaryResponse;
import com.nmt.history.service.TestService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;

    @GetMapping
    public List<TestSummaryResponse> getAllTests() {
        return testService.getAllTests();
    }

    @GetMapping("/{testId}")
    public TestDetailResponse getTest(@PathVariable Long testId) {
        return testService.getTest(testId);
    }

    @PostMapping("/create")
    public ResponseEntity<TestSummaryResponse> createTest(@Valid @RequestBody CreateTestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(testService.createTest(request));
    }

    @PostMapping("/questions/create")
    public ResponseEntity<QuestionEditResponse> createQuestion(@Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(testService.createQuestion(request));
    }

    @PutMapping("/{testId}")
    public TestSummaryResponse updateTest(@PathVariable Long testId, @Valid @RequestBody CreateTestRequest request) {
        return testService.updateTest(testId, request);
    }

    @DeleteMapping("/{testId}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long testId) {
        testService.deleteTest(testId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/questions/{questionId}")
    public QuestionEditResponse updateQuestion(@PathVariable Long questionId,
                                               @Valid @RequestBody CreateQuestionRequest request) {
        return testService.updateQuestion(questionId, request);
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        testService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/questions/{questionId}/image")
    public ResponseEntity<byte[]> questionImage(@PathVariable Long questionId) {
        return testService.questionImage(questionId);
    }

    @PostMapping("/{testId}/start")
    public AttemptResponse startAttempt(@PathVariable Long testId, Authentication authentication) {
        return testService.startAttempt(testId, authentication.getName());
    }

    @PostMapping("/{testId}/leave")
    public AttemptResponse recordLeave(@PathVariable Long testId, Authentication authentication) {
        return testService.recordLeave(testId, authentication.getName());
    }

    @PostMapping("/{testId}/submit")
    public TestResultResponse submitTest(@PathVariable Long testId,
                                         @Valid @RequestBody TestSubmitRequest request,
                                         Authentication authentication) {
        return testService.submitTest(testId, authentication.getName(), request);
    }
}
