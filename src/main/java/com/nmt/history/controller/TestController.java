package com.nmt.history.controller;

import com.nmt.history.dto.CreateQuestionRequest;
import com.nmt.history.dto.CreateTestRequest;
import com.nmt.history.dto.QuestionResponse;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
    public ResponseEntity<QuestionResponse> createQuestion(@Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(testService.createQuestion(request));
    }

    @PostMapping("/{testId}/submit")
    public TestResultResponse submitTest(@PathVariable Long testId,
                                         @Valid @RequestBody TestSubmitRequest request,
                                         Authentication authentication) {
        return testService.submitTest(testId, authentication.getName(), request);
    }
}
