package com.nmt.history.controller;

import com.nmt.history.dto.InviteCodeRequest;
import com.nmt.history.dto.ResetPasswordRequest;
import com.nmt.history.dto.TestEditResponse;
import com.nmt.history.service.InviteCodeService;
import com.nmt.history.service.TestService;
import com.nmt.history.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/tests/{testId}")
    public TestEditResponse getTestForEdit(@PathVariable Long testId) {
        return testService.getTestForEdit(testId);
    }

    @GetMapping("/invite-code")
    public Map<String, String> inviteCode() {
        return Map.of("code", inviteCodeService.current());
    }

    @PutMapping("/invite-code")
    public Map<String, String> setInviteCode(@Valid @RequestBody InviteCodeRequest request) {
        return Map.of("code", inviteCodeService.set(request.code()));
    }

    @PostMapping("/invite-code/regenerate")
    public Map<String, String> regenerateInviteCode() {
        return Map.of("code", inviteCodeService.regenerate());
    }

    @PutMapping("/students/{studentId}/password")
    public ResponseEntity<Void> resetStudentPassword(@PathVariable Long studentId,
                                                     @Valid @RequestBody ResetPasswordRequest request) {
        userService.resetStudentPassword(studentId, request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long studentId) {
        userService.deleteStudent(studentId);
        return ResponseEntity.noContent().build();
    }
}
