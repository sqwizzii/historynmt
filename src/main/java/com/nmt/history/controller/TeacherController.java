package com.nmt.history.controller;

import com.nmt.history.dto.FormImportRequest;
import com.nmt.history.dto.FormImportResponse;
import com.nmt.history.dto.InviteCodeRequest;
import com.nmt.history.dto.ResetPasswordRequest;
import com.nmt.history.dto.TestEditResponse;
import com.nmt.history.dto.TestStatsResponse;
import com.nmt.history.service.AccessPolicy;
import com.nmt.history.service.FormImportService;
import com.nmt.history.service.InviteCodeService;
import com.nmt.history.service.TestService;
import com.nmt.history.service.TestStatsService;
import com.nmt.history.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TestService testService;
    private final UserService userService;
    private final InviteCodeService inviteCodeService;
    private final TestStatsService statsService;
    private final FormImportService formImportService;
    private final AccessPolicy accessPolicy;

    @GetMapping("/tests/{testId}")
    public TestEditResponse getTestForEdit(@PathVariable Long testId, Authentication authentication) {
        return testService.getTestForEdit(testId, authentication.getName());
    }

    @GetMapping("/tests/{testId}/stats")
    public TestStatsResponse testStats(@PathVariable Long testId, Authentication authentication) {
        return statsService.stats(testId, authentication.getName());
    }

    @PostMapping("/import/google-form")
    public FormImportResponse importGoogleForm(@Valid @RequestBody FormImportRequest request,
                                                 Authentication authentication) {
        return formImportService.importForm(request, authentication.getName());
    }

    @GetMapping("/invite-code")
    public Map<String, String> inviteCode(Authentication authentication) {
        requireInviteManager(authentication);
        return Map.of("code", inviteCodeService.current());
    }

    @PutMapping("/invite-code")
    public Map<String, String> setInviteCode(@Valid @RequestBody InviteCodeRequest request,
                                             Authentication authentication) {
        requireInviteManager(authentication);
        return Map.of("code", inviteCodeService.set(request.code()));
    }

    @PostMapping("/invite-code/regenerate")
    public Map<String, String> regenerateInviteCode(Authentication authentication) {
        requireInviteManager(authentication);
        return Map.of("code", inviteCodeService.regenerate());
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

    private void requireInviteManager(Authentication authentication) {
        accessPolicy.requireInviteCodeManager(accessPolicy.requireActor(authentication.getName()));
    }
}
