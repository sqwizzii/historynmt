package com.nmt.history.imports;

import com.nmt.history.imports.ImportDtos.CreateRequest;
import com.nmt.history.imports.ImportDtos.CreateResponse;
import com.nmt.history.imports.ImportDtos.Preview;
import com.nmt.history.imports.ImportDtos.PreviewRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Доступний лише вчителям і адміністраторам (/api/teacher/**). Попередній перегляд нічого не зберігає. */
@RestController
@RequestMapping("/api/teacher/import")
@RequiredArgsConstructor
public class TestImportController {

    private final TestImportService importService;

    @PostMapping("/preview")
    public Preview preview(@Valid @RequestBody PreviewRequest request, Authentication authentication) {
        return importService.preview(request, authentication.getName());
    }

    @PostMapping("/create")
    public ResponseEntity<CreateResponse> create(@Valid @RequestBody CreateRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(importService.create(request, authentication.getName()));
    }
}
