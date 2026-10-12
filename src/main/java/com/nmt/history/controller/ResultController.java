package com.nmt.history.controller;

import com.nmt.history.dto.StudentResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.service.ResultService;
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

    @GetMapping("/results/my")
    public List<TestResultResponse> getMyResults(Authentication authentication) {
        return resultService.getMyResults(authentication.getName());
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
