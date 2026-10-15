package com.nmt.history.dto;

import com.nmt.history.model.Role;
import com.nmt.history.model.SubscriptionPlan;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record Stats(long users, long admins, long teachers, long students, long tests, long systemTests,
                        long modules, long systemModules, long subjects, long activeSubscriptions, long results) {
    }

    public record AdminUser(Long id, String username, String fullName, String email, Role role, Long teacherId,
                            SubscriptionStatusResponse subscription) {
    }

    public record Page<T>(List<T> items, long total, int page, int size) {
    }

    public record RoleRequest(@NotNull Role role) {
    }

    public record SubscriptionRequest(@NotNull SubscriptionPlan plan) {
    }

    public record SubjectRequest(
            @NotBlank @Size(max = 120) String name,
            @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug: латиниця, цифри й дефіси") @Size(max = 60) String slug,
            @Min(0) @Max(100000) Integer sortOrder,
            Boolean active) {
    }

    public record AdminSubject(Long id, String slug, String name, int sortOrder, boolean active, long materials) {
    }
}
