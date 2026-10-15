package com.nmt.history.controller;

import com.nmt.history.dto.SubjectResponse;
import com.nmt.history.repository.SubjectRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectRepository subjectRepository;

    @GetMapping
    public List<SubjectResponse> subjects() {
        return subjectRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream().map(SubjectResponse::from).toList();
    }
}
