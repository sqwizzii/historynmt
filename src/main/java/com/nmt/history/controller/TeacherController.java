package com.nmt.history.controller;

import com.nmt.history.dto.AnalyticsSummaryResponse;
import com.nmt.history.dto.FormImportRequest;
import com.nmt.history.dto.FormImportResponse;
import com.nmt.history.dto.GradeResultRequest;
import com.nmt.history.dto.InviteCodeRequest;
import com.nmt.history.dto.ResetPasswordRequest;
import com.nmt.history.dto.TestEditResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.dto.TestStatsResponse;
import com.nmt.history.imports.SpreadsheetImportDtos.ImportResult;
import com.nmt.history.imports.SpreadsheetImportDtos.PreviewResponse;
import com.nmt.history.imports.SpreadsheetImportService;
import com.nmt.history.service.AccessPolicy;
import com.nmt.history.service.FormImportService;
import com.nmt.history.service.GradingService;
import com.nmt.history.service.InviteCodeService;
import com.nmt.history.service.ReportExportService;
import com.nmt.history.service.TestService;
import com.nmt.history.service.TestStatsService;
import com.nmt.history.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TestService testService;
    private final UserService userService;
    private final InviteCodeService inviteCodeService;
    private final TestStatsService statsService;
    private final FormImportService formImportService;
    private final AccessPolicy accessPolicy;
    private final com.nmt.history.service.AssignmentService assignmentService;
    private final SpreadsheetImportService spreadsheetImportService;
    private final ReportExportService reportExportService;
    private final GradingService gradingService;

    @GetMapping("/tests/{testId}")
    public TestEditResponse getTestForEdit(@PathVariable Long testId, Authentication authentication) {
        return testService.getTestForEdit(testId, authentication.getName());
    }

    @GetMapping("/tests/{testId}/stats")
    public TestStatsResponse testStats(@PathVariable Long testId,
                                       @RequestParam(required = false) Long studentId,
                                       Authentication authentication) {
        return statsService.stats(testId, studentId, authentication.getName());
    }

    @GetMapping("/analytics")
    public AnalyticsSummaryResponse analytics(@RequestParam(required = false) Long testId,
                                              @RequestParam(required = false) Long studentId,
                                              Authentication authentication) {
        return statsService.analytics(authentication.getName(), testId, studentId);
    }

    @GetMapping("/results/pending")
    public List<TestResultResponse> pendingResults(Authentication authentication) {
        return gradingService.pendingForTeacher(authentication.getName());
    }

    @PostMapping("/results/{resultId}/grade")
    public TestResultResponse gradeResult(@PathVariable Long resultId,
                                          @Valid @RequestBody GradeResultRequest request,
                                          Authentication authentication) {
        return gradingService.grade(resultId, request, authentication.getName());
    }

    @PostMapping(value = "/tests/{testId}/import/spreadsheet/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PreviewResponse previewSpreadsheet(@PathVariable Long testId,
                                              @RequestParam("file") MultipartFile file,
                                              Authentication authentication) {
        return spreadsheetImportService.preview(testId, file, authentication.getName());
    }

    @PostMapping(value = "/tests/{testId}/import/spreadsheet", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResult importSpreadsheet(@PathVariable Long testId,
                                          @RequestParam("file") MultipartFile file,
                                          Authentication authentication) {
        return spreadsheetImportService.importQuestions(testId, file, authentication.getName());
    }

    @GetMapping("/import/spreadsheet/template")
    public ResponseEntity<byte[]> spreadsheetTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"masterly-questions-template.csv\"")
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .body(spreadsheetImportService.templateCsv());
    }

    @GetMapping("/export/results")
    public ResponseEntity<byte[]> exportResults(@RequestParam(required = false) Long testId,
                                                @RequestParam(required = false) Long studentId,
                                                @RequestParam(defaultValue = "csv") String format,
                                                Authentication authentication) {
        byte[] body = reportExportService.exportResults(testId, studentId, format, authentication.getName());
        return exportResponse(body, "masterly-results." + format.toLowerCase(), format);
    }

    @GetMapping("/tests/{testId}/export/stats")
    public ResponseEntity<byte[]> exportStats(@PathVariable Long testId,
                                              @RequestParam(defaultValue = "csv") String format,
                                              Authentication authentication) {
        byte[] body = reportExportService.exportTestStats(testId, format, authentication.getName());
        return exportResponse(body, "masterly-stats-" + testId + "." + format.toLowerCase(), format);
    }

    private static ResponseEntity<byte[]> exportResponse(byte[] body, String filename, String format) {
        MediaType type = "xlsx".equalsIgnoreCase(format)
                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(type)
                .body(body);
    }

    @GetMapping("/tests/{testId}/assignments")
    public Map<String, java.util.List<Long>> assignments(@PathVariable Long testId, Authentication authentication) {
        return Map.of("studentIds", assignmentService.assignedStudentIds(testId, authentication.getName()));
    }

    @PutMapping("/tests/{testId}/assignments")
    public Map<String, java.util.List<Long>> assign(@PathVariable Long testId,
                                                    @RequestBody Map<String, java.util.List<Long>> body,
                                                    Authentication authentication) {
        return Map.of("studentIds", assignmentService.replace(testId, body.get("studentIds"), authentication.getName()));
    }

    @PostMapping("/import/google-form")
    public FormImportResponse importGoogleForm(@Valid @RequestBody FormImportRequest request,
                                                 Authentication authentication) {
        return formImportService.importForm(request, authentication.getName());
    }

    @GetMapping("/invite-code")
    public Map<String, String> inviteCode(Authentication authentication) {
        return Map.of("code", inviteCodeService.current(accessPolicy.requireTeacher(authentication.getName())));
    }

    @PutMapping("/invite-code")
    public Map<String, String> setInviteCode(@Valid @RequestBody InviteCodeRequest request,
                                             Authentication authentication) {
        return Map.of("code", inviteCodeService.set(accessPolicy.requireTeacher(authentication.getName()), request.code()));
    }

    @PostMapping("/invite-code/regenerate")
    public Map<String, String> regenerateInviteCode(Authentication authentication) {
        return Map.of("code", inviteCodeService.regenerate(accessPolicy.requireTeacher(authentication.getName())));
    }

    @PutMapping("/students/{studentId}/password")
    public ResponseEntity<Void> resetStudentPassword(@PathVariable Long studentId,
                                                     @Valid @RequestBody ResetPasswordRequest request,
                                                     Authentication authentication) {
        userService.resetStudentPassword(studentId, request.newPassword(), authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long studentId, Authentication authentication) {
        userService.deleteStudent(studentId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
