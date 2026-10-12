package com.nmt.history.dto;

import java.util.List;

public record FormImportResponse(Long testId, String title, int imported, List<Skipped> skipped, List<String> warnings) {

    public record Skipped(String question, String reason) {
    }
}
