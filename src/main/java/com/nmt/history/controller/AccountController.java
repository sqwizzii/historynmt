package com.nmt.history.controller;

import com.nmt.history.dto.ChangePasswordRequest;
import com.nmt.history.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                               Authentication authentication) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
