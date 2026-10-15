package com.nmt.history.dto;

import com.nmt.history.model.Subject;

public record SubjectResponse(Long id, String slug, String name) {

    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(subject.getId(), subject.getSlug(), subject.getName());
    }
}
