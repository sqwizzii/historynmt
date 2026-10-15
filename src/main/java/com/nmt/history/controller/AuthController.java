package com.nmt.history.controller;

import com.nmt.history.dto.JwtResponse;
import com.nmt.history.dto.LoginRequest;
import com.nmt.history.dto.RegisterRequest;
import com.nmt.history.dto.RegisterTeacherRequest;
import com.nmt.history.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/register-teacher")
    public ResponseEntity<JwtResponse> registerTeacher(@Valid @RequestBody RegisterTeacherRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerTeacher(request));
    }

    @PostMapping("/login")
    public JwtResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
