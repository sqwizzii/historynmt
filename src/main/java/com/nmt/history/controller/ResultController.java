package com.nmt.history.controller;

import com.nmt.history.dto.StudentResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.dto.TopicStat;
import com.nmt.history.model.Role;
import com.nmt.history.service.ResultService;
import com.nmt.history.service.TopicStatsService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;
    private final TopicStatsService topicStatsService;

    @GetMapping("/results/my")
    public List<TestResultResponse> getMyResults(Authentication authentication) {
        return resultService.getMyResults(authentication.getName());
    }

    @GetMapping("/results/my/topics")
    public List<TopicStat> getMyTopics(Authentication authentication) {
        return topicStatsService.forUsername(authentication.getName());
    }

    @GetMapping("/teacher/students/{studentId}/topics")
    public List<TopicStat> getStudentTopics(@PathVariable Long studentId) {
        return topicStatsService.forStudent(studentId);
    }

    @GetMapping("/results/{resultId}")
    public TestResultResponse getResult(@PathVariable Long resultId, Authentication authentication) {
        boolean teacher = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.TEACHER.name()));
        return resultService.getResult(resultId, authentication.getName(), teacher);
    }

    @GetMapping("/teacher/results")
    public List<TestResultResponse> getAllResults() {
        return resultService.getAllResults();
    }

    @GetMapping("/teacher/students")
    public List<StudentResponse> getStudents() {
        return resultService.getStudents();
    }

    @GetMapping("/teacher/students/{studentId}/results")
    public List<TestResultResponse> getStudentResults(@PathVariable Long studentId) {
        return resultService.getStudentResults(studentId);
    }
}
