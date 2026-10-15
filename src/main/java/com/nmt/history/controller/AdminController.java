package com.nmt.history.controller;

import com.nmt.history.dto.AdminDtos.AdminSubject;
import com.nmt.history.dto.AdminDtos.AdminUser;
import com.nmt.history.dto.AdminDtos.Page;
import com.nmt.history.dto.AdminDtos.RoleRequest;
import com.nmt.history.dto.AdminDtos.Stats;
import com.nmt.history.dto.AdminDtos.SubjectRequest;
import com.nmt.history.dto.AdminDtos.SubscriptionRequest;
import com.nmt.history.model.Role;
import com.nmt.history.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public Stats stats(Authentication auth) {
        return adminService.stats(auth.getName());
    }

    @GetMapping("/users")
    public Page<AdminUser> users(@RequestParam(defaultValue = "") String q, @RequestParam(required = false) Role role,
                                 @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
                                 Authentication auth) {
        return adminService.users(auth.getName(), q, role, page, size);
    }

    @PutMapping("/users/{id}/role")
    public AdminUser changeRole(@PathVariable Long id, @Valid @RequestBody RoleRequest request, Authentication auth) {
        return adminService.changeRole(auth.getName(), id, request.role());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        adminService.deleteUser(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/subscription")
    public AdminUser grant(@PathVariable Long id, @Valid @RequestBody SubscriptionRequest request, Authentication auth) {
        return adminService.grantSubscription(auth.getName(), id, request.plan());
    }

    @DeleteMapping("/users/{id}/subscription")
    public AdminUser cancel(@PathVariable Long id, Authentication auth) {
        return adminService.cancelSubscription(auth.getName(), id);
    }

    @GetMapping("/subjects")
    public List<AdminSubject> subjects(Authentication auth) {
        return adminService.subjects(auth.getName());
    }

    @PostMapping("/subjects")
    public ResponseEntity<AdminSubject> createSubject(@Valid @RequestBody SubjectRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createSubject(auth.getName(), request));
    }

    @PutMapping("/subjects/{id}")
    public AdminSubject updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectRequest request, Authentication auth) {
        return adminService.updateSubject(auth.getName(), id, request);
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id, Authentication auth) {
        adminService.deleteSubject(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
