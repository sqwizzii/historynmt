package com.nmt.history.service;

import com.nmt.history.dto.JwtResponse;
import com.nmt.history.dto.LoginRequest;
import com.nmt.history.dto.RegisterRequest;
import com.nmt.history.exception.ConflictException;
import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import com.nmt.history.repository.UserRepository;
import com.nmt.history.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final LoginAttemptService loginAttemptService;

    @Transactional
    public JwtResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username уже зайнятий");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email уже використовується");
        }

        User user = userRepository.save(User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.STUDENT)
                .build());

        return JwtResponse.bearer(jwtUtils.generateToken(user.getUsername(), user.getRole()),
                user.getUsername(), user.getRole());
    }

    @Transactional(readOnly = true)
    public JwtResponse login(LoginRequest request) {
        loginAttemptService.assertNotBlocked(request.username());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (AuthenticationException e) {
            loginAttemptService.recordFailure(request.username());
            throw e;
        }
        loginAttemptService.reset(request.username());

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Невірні облікові дані"));

        return JwtResponse.bearer(jwtUtils.generateToken(user.getUsername(), user.getRole()),
                user.getUsername(), user.getRole());
    }
}
