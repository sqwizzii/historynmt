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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;

    @GetMapping
    public List<TestSummaryResponse> getAllTests(Authentication authentication) {
        return testService.getAllTests(name(authentication));
    }

    @GetMapping("/{testId}")
    public TestDetailResponse getTest(@PathVariable Long testId, Authentication authentication) {
        return testService.getTest(testId, name(authentication));
    }

    @PostMapping("/create")
    public ResponseEntity<TestSummaryResponse> createTest(@Valid @RequestBody CreateTestRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(testService.createTest(request, name(authentication)));
    }

    @PostMapping("/questions/create")
    public ResponseEntity<QuestionEditResponse> createQuestion(@Valid @RequestBody CreateQuestionRequest request,
                                                             Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(testService.createQuestion(request, name(authentication)));
    }

    @PutMapping("/{testId}")
    public TestSummaryResponse updateTest(@PathVariable Long testId, @Valid @RequestBody CreateTestRequest request,
                                         Authentication authentication) {
        return testService.updateTest(testId, request, name(authentication));
    }

    @DeleteMapping("/{testId}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long testId, Authentication authentication) {
        testService.deleteTest(testId, name(authentication));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/questions/{questionId}")
    public QuestionEditResponse updateQuestion(@PathVariable Long questionId,
                                               @Valid @RequestBody CreateQuestionRequest request,
                                               Authentication authentication) {
        return testService.updateQuestion(questionId, request, name(authentication));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId, Authentication authentication) {
        testService.deleteQuestion(questionId, name(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/questions/{questionId}/image")
    public ResponseEntity<byte[]> questionImage(@PathVariable Long questionId,
                                                @RequestParam(required = false) String exp,
                                                @RequestParam(required = false) String sig) {
        return testService.questionImage(questionId, exp, sig);
    }

    @GetMapping("/options/{optionId}/image")
    public ResponseEntity<byte[]> optionImage(@PathVariable Long optionId,
                                              @RequestParam(required = false) String exp,
                                              @RequestParam(required = false) String sig) {
        return testService.optionImage(optionId, exp, sig);
    }

    @PostMapping("/{testId}/start")
    public AttemptResponse startAttempt(@PathVariable Long testId, Authentication authentication) {
        return testService.startAttempt(testId, authentication.getName());
    }

    @PostMapping("/{testId}/leave")
    public AttemptResponse recordLeave(@PathVariable Long testId, Authentication authentication) {
        return testService.recordLeave(testId, authentication.getName());
    }

    @PostMapping("/{testId}/questions/{questionId}/check")
    public com.nmt.history.dto.QuestionReview checkAnswer(@PathVariable Long testId, @PathVariable Long questionId,
                                                          @RequestBody com.nmt.history.dto.AnswerRequest request,
                                                          Authentication authentication) {
        return testService.checkAnswer(testId, questionId, request, authentication.getName());
    }

    @PostMapping("/{testId}/submit")
    public TestResultResponse submitTest(@PathVariable Long testId,
                                         @Valid @RequestBody TestSubmitRequest request,
                                         Authentication authentication) {
        return testService.submitTest(testId, authentication.getName(), request);
    }

    private static String name(Authentication authentication) {
        return authentication == null ? null : authentication.getName();
    }
}
